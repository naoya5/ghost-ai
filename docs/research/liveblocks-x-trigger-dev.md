# Liveblocks × Trigger.dev 連携パターン

> リアルタイムコラボ基盤(Liveblocks)と、信頼性の高いバックグラウンドジョブ基盤(Trigger.dev)を組み合わせる発想メモ。

## なぜ組み合わせるのか

- **Liveblocks**は「ユーザーが見ている瞬間」のコラボ体験に強い(WebSocket / 低レイテンシ)
- **Trigger.dev**は「裏側で時間のかかる処理」に強い(durableなジョブ / リトライ / スケジュール)
- 両者は守備範囲が綺麗に分かれており、補完関係になりやすい

## パターン1: 重い処理を裏に逃がす

ユーザーが Liveblocks の Room 内で「AIで議事録要約」や「PDF書き出し」などの重い操作をトリガー。

```
[User in Liveblocks Room]
        │ ボタン押下
        ▼
[Next.js API / Server Action]
        │ Trigger.dev のtaskを起動
        ▼
[Trigger.dev Task] ───────► LLM / PDF生成 / 動画変換 ...
        │ 完了
        ▼
[Liveblocks Notifications API] ─► ユーザーに通知
        │
        ▼
[Liveblocks Storage 更新] ─────► Roomに結果反映
```

**ポイント**

- フロントは即座にレスポンスを返してUXを保つ
- 結果反映は Liveblocks Notifications + Storage 経由で全参加者へリアルタイム配信

## パターン2: Liveblocks Webhook → Trigger.dev

Liveblocksのイベント(コメント追加・スレッド作成・メンションなど)を起点にバックグラウンドジョブを発火する。

```
[Liveblocks Webhook]
   (commentCreated / threadCreated / userMentioned)
        │
        ▼
[Next.js Webhook Endpoint]
        │ tasks.trigger("summarize-thread", payload)
        ▼
[Trigger.dev Task] ──► 要約生成 / Slack通知 / ナレッジベース更新
```

**ユースケース例**

- スレッドが立ったら自動で要約 → コメントに追記
- メンションされたら担当者にメール / Slack 通知
- コメント解決時に外部チケットシステム(Linear, Jira)を更新

## パターン3: AI Copilot から長時間タスクを起動

Liveblocks AI Copilot のツール呼び出しから Trigger.dev のジョブを起動し、結果を Storage や Notifications で返す。

```
[User] ──質問──► [AI Copilot in Room]
                       │ ツール呼び出し
                       ▼
            [Trigger.dev Task: deepResearch]
                       │  数分かけてWeb検索 + 要約
                       ▼
            [Liveblocks Storage に結果書き込み]
                       │
                       ▼
            [AI Copilot 応答 + Notification]
```

**ポイント**

- AI Copilotのツール定義から、長時間ジョブを「気にせず」起動できる
- 進捗はTrigger.devのrun状態 → Webhook → LiveblocksのRoomへ反映可能

## パターン4: Trigger.dev Schedules でRoom状態を定期メンテ

Cronタスクで以下のような定期処理を回す。

- 古い未読 Comments をクリーンアップ
- Roomごとの利用統計を集計してダッシュボードに反映
- 一定時間放置された Storage を圧縮 / アーカイブ

```ts
import { schedules } from "@trigger.dev/sdk";
import { Liveblocks } from "@liveblocks/node";

export const archiveStaleRooms = schedules.task({
  id: "archive-stale-rooms",
  run: async () => {
    const liveblocks = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET! });
    // 古いroomを取得 → アーカイブ処理
  },
});
```

## 検討メモ

- **エラー時の通知UX**: Trigger.dev側のretry失敗を Liveblocks Notifications でユーザーに伝える設計が綺麗
- **冪等性**: Webhook起点でジョブを起動する場合、Liveblocksイベントの再送に備えて `idempotencyKey` を付与
- **コスト**: Liveblocks(MAU/メッセージ)とTrigger.dev(実行時間)で課金軸が違うので、組み合わせると最適化しやすい
- **ローカル開発**: 両者ともローカル動作可。`trigger.dev dev` + Liveblocks のdevtoolsでフルスタック検証ができる

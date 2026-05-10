# Trigger.dev

> OSSのバックグラウンドジョブ&AIワークフロー基盤。「タイムアウトなしのサーバーレス」がウリ。

## 概要

Trigger.devは、信頼性の高いバックグラウンドジョブ・ワークフローをプレーンなasyncコードで書けるOSSプラットフォーム。キューイング・自動リトライ・リアルタイム監視がビルトイン。

- 公式: https://trigger.dev
- リポジトリ: https://github.com/triggerdotdev/trigger.dev
- SDK: `@trigger.dev/sdk`
- CLI: `npx trigger.dev@latest`

## 主要機能

| 機能 | 内容 |
| --- | --- |
| **Tasks** | `task({ id, retry, run })`形式。普通のasync関数として書ける |
| **Schedules** | `schedules.task`でcronジョブ。1タスクに複数スケジュールアタッチ可 |
| **自動リトライ** | `maxAttempts` / `factor` / `min/maxTimeoutInMs` で指数バックオフ |
| **Durable Checkpointing** | 長時間実行でも状態が永続化(タイムアウトなし) |
| **Realtime Monitoring** | ダッシュボードでrun追跡 / ログ表示 |
| **ローカル開発** | `npx trigger.dev@latest dev` で本番と同じ挙動 |
| **デプロイ** | `npx trigger.dev@latest deploy` でビルド&デプロイ |

## アーキテクチャ要点

- タスクコードをビルドして隔離された安全な実行環境で実行(タスクキュー / スケジューラー / ワーカープール)
- **Cloud版** または **セルフホスト** が選択可能
- マネージド・オートスケール構成のため、サーバー管理やタイムアウト設定が不要
- 高並列ワークロードに耐え、自動リトライ + durable checkpointing で信頼性を担保

## コードサンプル

### 基本のTask定義 + リトライ

```ts
import { task } from "@trigger.dev/sdk";

export const myTask = task({
  id: "my-task",
  retry: {
    maxAttempts: 3,
    factor: 1.8,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: { url: string }) => {
    // タイムアウトなし — 必要なだけ実行可
    return { success: true };
  },
});
```

### Cronスケジュール

```ts
import { schedules } from "@trigger.dev/sdk";

export const sendMondayNewsletter = schedules.task({
  id: "send-monday-newsletter",
  run: async (payload) => {
    // business logic
  },
});
```

スケジュールは `cron` 文字列をタスク自体ではなく外部からアタッチする設計(同一タスクに複数スケジュールを紐付けられる)。

## 想定ユースケース

- AIエージェント・LLM呼び出しのワークフロー(長時間 / 多段階)
- メール送信・通知の非同期処理
- 動画・画像・PDF生成といった重い処理
- データETL / 定期バッチ
- Webhook受信後の後続処理
- ユーザーからのアクション後の遅延ジョブ

## 検討メモ

- **強み**: HTTPハンドラ起点ではなく「普通のasyncコード」を書く感覚で長時間ジョブを定義できる。リトライ・並行制御・スケジュールが全部コードに同居
- **OSS+Cloud両対応**: ロックインを嫌うチームにも刺さる
- **AI連携前提**: 公式ドキュメント `building-with-ai.mdx` がある通り、LLMワークフローの土台として設計されている
- **マイグレーション**: Defer / Mergent などの旧来サービスからの移行ガイドあり

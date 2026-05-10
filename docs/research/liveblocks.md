# Liveblocks

> リアルタイムコラボ機能を爆速で組み込めるインフラ。「AI時代のアプリはソロ体験じゃなく協働体験」がコンセプト。

## 概要

Liveblocksは、コラボレーティブ機能を構築するためのインフラストラクチャ。WebSocketベースのリアルタイム同期と、それに付随するUIプリミティブ・REST API・Webhookを提供する。

- 公式: https://liveblocks.io
- パッケージ: `@liveblocks/client` / `@liveblocks/react` / `@liveblocks/node` ほか
- 接続単位は「Room」(部屋)

## 主要プロダクト

| プロダクト | 役割 |
| --- | --- |
| **Presence** | カーソル位置・選択範囲など一時的状態をリアルタイム同期 |
| **Storage / Sync Datastore** | CRDT風の永続データ同期(LiveObject / LiveList / LiveMap) |
| **Comments** | スレッド・メンション・リアクション付きコメント |
| **Notifications** | アプリ内通知 + Email通知 |
| **Text Editor** | Tiptap / Lexical / BlockNote 連携の共同編集 |
| **AI Copilots** | Roomの文脈を理解するAIアシスタント |

## アーキテクチャ要点

- **Room** が同期スコープ。1Roomに複数ユーザーが接続
- 認証はサーバー側(Node SDK)でセッショントークンを発行 → クライアントが接続
- Webhookで外部システムへイベント連携(コメント追加 / メンション / スレッド作成 etc.)
- AI Copilotsは `RegisterAiKnowledge` でstorageやコメントの内容を文脈として渡せる

## コードサンプル

### AI Copilot 作成 (Node.js)

```ts
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: "{{SECRET_KEY}}",
});

const copilot = await liveblocks.createAiCopilot({
  name: "My AI Assistant",
  systemPrompt: "You're a helpful assistant that can answer questions.",
  provider: "openai",
  providerModel: "gpt-4",
  providerApiKey: "sk-...",
});
```

### AIエージェントのPresenceを設定

```ts
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({ secret: "{{SECRET_KEY}}" });

await liveblocks.setPresence("my-room-id", {
  userId: "agent-123",
  data: {
    status: "active",
    cursor: { x: 100, y: 200 },
  },
  userInfo: {
    name: "AI Assistant",
    avatar: "https://example.com/avatar.png",
    color: "#22c55e",
  },
  ttl: 30,
});
```

### Storage を AI Knowledge として登録

```tsx
import { RegisterAiKnowledge, useStorage } from "@liveblocks/react/suspense";

function Whiteboard() {
  const shapes = useStorage((root) => root.shapes);

  return (
    <div>
      <RegisterAiKnowledge
        description="The current shapes on the whiteboard"
        value={shapes}
      />
      {/* ... */}
    </div>
  );
}
```

### コメントスレッドを AI Knowledge として登録

```tsx
import { RegisterAiKnowledge, useThreads } from "@liveblocks/react";

function Comments() {
  const { threads, isLoading, error } = useThreads();

  return (
    <div>
      <RegisterAiKnowledge
        description="The comment threads in the current document"
        value={
          isLoading ? "Loading..."
          : error ? "Problem fetching threads"
          : threads
        }
      />
      {/* ... */}
    </div>
  );
}
```

## 想定ユースケース

- Figma風ホワイトボード / 図形エディタ
- Notion風ドキュメントの共同編集
- AI Copilot付きのドキュメント・コードエディタ
- ライブダッシュボード、フォーム共同入力
- ゲーム的なリアルタイムマルチプレイUI

## 検討メモ

- **強み**: SDKが厚く、UIプリミティブまで揃っているので「ゼロから同期エンジン書く」労力をスキップできる
- **注意**: 接続数(MAU)・メッセージ数で課金されるため、Pricingは早めに確認
- **AI連携**: `RegisterAiKnowledge` でドキュメント文脈をそのままAIに渡せるのは強力。RAGっぽい実装を自前で組まずに済む

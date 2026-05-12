
## 六つのコンテキストファイルで管理する

[[Ghost-ai/Six-File+Context+Methodology/templates/context]]に存在する

project rootにcontext folderを作成してプロジェクトの状態を管理する

それぞれの作業でspecs fileを作って作業させる（AIへの指示だしプロンプトを.mdで詳細に書く必要がある）

基本的には、開発をさせて違うブランチにコミットしてpushしてPR出してcoderabbitとかにレビューさせる流れが基本になる

## 開発をする上でskillsを使う

prismaやclerkなどのはAgent skillsが公式から出ているのでそれらを導入して開発をすることで、スムーズに正しく開発できる

```bash
npx skills add clerk/skills
npx skills add prisma/skills
```

## projects

```
┌─────────────────────────────────────────┐
│             Project                     │
├─────────────────────────────────────────┤
│ id              String   PK             │
│ ownerId         String   ← Clerk userId │
│ name            String                  │
│ description     String?                 │
│ status          Status   (DRAFT|ARCHIVED)│
│ canvasJsonPath  String?                 │
│ createdAt       DateTime                │
│ updatedAt       DateTime                │
├─────────────────────────────────────────┤
│ @@index([ownerId])                      │
│ @@index([createdAt])                    │
└──────────────┬──────────────────────────┘
               │ 1
               │
               │ collaborators (onDelete: Cascade)
               │
               │ N
┌──────────────┴──────────────────────────┐
│        ProjectCollaborator              │
├─────────────────────────────────────────┤
│ id          String   PK                 │
│ projectId   String   FK → Project.id    │
│ email       String                      │
│ createdAt   DateTime                    │
├─────────────────────────────────────────┤
│ @@unique([projectId, email])            │
│ @@index([email])                        │
│ @@index([projectId, createdAt])         │
└─────────────────────────────────────────┘
```

関係性のサマリ

```
 Clerk User ──(ownerId)──▶ Project ──1:N──▶ ProjectCollaborator
                            │                       ▲
                            └── cascade delete ─────┘
```

- `Project.ownerId` は Clerk の userId をそのまま入れる外部参照（DBにはFKなし）
- `ProjectCollaborator.projectId` は `Project.id` への FK で **cascade delete**
- `(projectId, email)` で一意制約 → 同じ人を二重招待できない
- インデックスは検索系（owner一覧 / email検索 / プロジェクト別の招待履歴順）に効く配置

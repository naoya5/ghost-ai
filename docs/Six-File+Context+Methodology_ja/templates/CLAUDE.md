## アプリケーション構築コンテキスト

実装やアーキテクチャ上の意思決定を行う前に、以下のファイルを順番に読み込むこと:

1. `context/project-overview.md` — プロダクトの定義、
   ゴール、機能、スコープ
2. `context/architecture.md` — システム構造、
   境界、ストレージモデル、不変条件 (invariants)
3. `context/ui-context.md` — テーマ、カラー、タイポグラフィ、
   およびコンポーネントの規約
4. `context/code-standards.md` — 実装ルールと
   コーディング規約
5. `context/ai-workflow-rules.md` — 開発ワークフロー、
   スコープルール、デリバリーアプローチ
6. `context/progress-tracker.md` — 現フェーズ、
   完了済みの作業、未解決の質問、次のステップ

実装に意味のある変更があるたびに `context/progress-tracker.md`
を更新すること。

実装によってコンテキストファイルに記載されたアーキテクチャ、
スコープ、または基準が変わる場合は、続行する前に該当ファイルを
更新すること。

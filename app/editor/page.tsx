import { NewProjectButton } from "@/components/editor/new-project-button";

export default function EditorHome() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-copy-primary">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-copy-muted">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
      </div>
      <NewProjectButton />
    </main>
  );
}

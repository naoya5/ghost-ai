import { FileTextIcon, SparklesIcon, UsersIcon } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
}

const features = [
  {
    icon: SparklesIcon,
    title: "AI Architecture Generation",
    description: "Describe your system. AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: UsersIcon,
    title: "Real-time Collaboration",
    description: "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileTextIcon,
    title: "Instant Spec Generation",
    description: "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-1 items-stretch">
      <aside className="hidden w-1/2 flex-col justify-between bg-base px-12 py-10 lg:flex">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-md bg-brand"
          >
            <span className="block h-3 w-3 rounded-sm bg-base" />
          </span>
          <span className="text-base font-semibold tracking-tight text-copy-primary">
            Ghost AI
          </span>
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-copy-primary">
              Design systems at the
              <br />
              speed of thought.
            </h1>
            <p className="text-sm leading-relaxed text-copy-secondary">
              Describe your architecture in plain English. Ghost AI maps it to a
              shared canvas your whole team can refine in real time.
            </p>
          </div>

          <ul className="space-y-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-surface-border bg-surface">
                    <Icon className="h-4 w-4 text-copy-secondary" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-copy-primary">
                      {feature.title}
                    </p>
                    <p className="text-xs leading-relaxed text-copy-muted">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs text-copy-faint">
          © 2026 Ghost AI. All rights reserved.
        </p>
      </aside>

      <section className="flex flex-1 items-center justify-center bg-surface px-6 py-10 lg:w-1/2">
        {children}
      </section>
    </main>
  );
}

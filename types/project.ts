export type ProjectOwnership = "owner" | "collaborator";

export interface Project {
  id: string;
  name: string;
  slug: string;
  ownership: ProjectOwnership;
}

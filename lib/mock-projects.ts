import type { Project } from "@/types/project";

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p_realtime_chat",
    name: "Realtime Chat Backend",
    slug: "realtime-chat-backend",
    ownership: "owner",
  },
  {
    id: "p_image_pipeline",
    name: "Image Pipeline",
    slug: "image-pipeline",
    ownership: "owner",
  },
  {
    id: "p_team_kb",
    name: "Team Knowledge Base",
    slug: "team-knowledge-base",
    ownership: "collaborator",
  },
];

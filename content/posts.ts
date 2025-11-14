export type Post = {
  slug: string;
  title: string;
  summary?: string;
  date: string;
};

export const posts: Post[] = [
  {
    slug: "why-budget-shark",
    title: "Why Budget Shark Exists",
    summary: "Killing spreadsheet chaos and speeding up decisions.",
    date: "2025-10-29",
  },
  {
    slug: "roadmap-beta-and-pricing",
    title: "Roadmap: Beta & Pricing",
    summary: "What’s coming, how to join the beta, and pricing thoughts.",
    date: "2025-10-29",
  },
];

import { z } from "zod";
import type { GitHubService } from "../services/github-service.js";
import type { ToolDefinition } from "./types.js";

const emptyArgsSchema = z.object({});
type EmptyArgs = z.infer<typeof emptyArgsSchema>;

const createPrArgsSchema = z.object({
  title: z.string().min(1, "title is required"),
  body: z.string().min(1, "body is required"),
  head: z.string().min(1, "head is required"),
  base: z.string().min(1, "base must not be empty").default("main"),
});
type CreatePrArgs = z.infer<typeof createPrArgsSchema>;

export function createGitHubTools(
  service: GitHubService,
): Array<ToolDefinition<EmptyArgs> | ToolDefinition<CreatePrArgs>> {
  return [
    {
      name: "github_list_prs",
      description: "List all open pull requests in the repo",
      inputSchema: { type: "object", properties: {} },
      argsSchema: emptyArgsSchema,
      execute: async (_args: EmptyArgs) => service.listPullRequests(),
    },
    {
      name: "github_create_pr",
      description: "Create a new pull request",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "PR title" },
          body: { type: "string", description: "PR description" },
          head: { type: "string", description: "Branch to merge from" },
          base: { type: "string", description: "Branch to merge into" },
        },
        required: ["title", "body", "head"],
      },
      argsSchema: createPrArgsSchema,
      execute: async (args: CreatePrArgs) => service.createPullRequest(args),
    },
  ];
}

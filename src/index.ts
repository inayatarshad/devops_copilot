import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ToolExecutionError } from "./errors.js";
import { github_list_prs, github_create_pr } from "./tools/github.js";

const createPrArgsSchema = z.object({
  title: z.string().min(1, "title is required"),
  body: z.string().min(1, "body is required"),
  head: z.string().min(1, "head is required"),
  base: z.string().min(1, "base must not be empty").default("main"),
});

const server = new Server(
  { name: "devops-copilot", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "github_list_prs",
      description: "List all open pull requests in the repo",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "github_create_pr",
      description: "Create a new pull request",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "PR title" },
          body:  { type: "string", description: "PR description" },
          head:  { type: "string", description: "Branch to merge from" },
          base:  { type: "string", description: "Branch to merge into" },
        },
        required: ["title", "body", "head"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    if (name === "github_list_prs") {
      const result = await github_list_prs();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "github_create_pr") {
      const parsedArgs = createPrArgsSchema.parse(args ?? {});
      const result = await github_create_pr(
        parsedArgs.title,
        parsedArgs.body,
        parsedArgs.head,
        parsedArgs.base,
      );

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    throw new ToolExecutionError(`Unknown tool: ${name}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((issue) => issue.message).join(", ");
      throw new ToolExecutionError(`Invalid arguments: ${details}`);
    }

    if (error instanceof ToolExecutionError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ToolExecutionError(error.message);
    }

    throw new ToolExecutionError("Unknown server error.");
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

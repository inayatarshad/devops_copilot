import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistry } from "./tool-registry.js";
import { log } from "./logger.js";

export function createMcpServer(toolRegistry: ToolRegistry) {
  const server = new Server(
    { name: "devops-copilot", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolRegistry.list(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    log("info", "Executing MCP tool", { tool: name });

    const result = await toolRegistry.execute(name, args);

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  });

  return server;
}

export async function startStdioServer(server: Server) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("info", "DevOps Copilot MCP server connected over stdio");
}

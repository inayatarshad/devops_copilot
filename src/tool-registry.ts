import { ZodError } from "zod";
import { ToolExecutionError } from "./errors.js";
import type { ToolDefinition } from "./tools/types.js";

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition<any, unknown>>();

  constructor(definitions: Array<ToolDefinition<any, unknown>>) {
    for (const tool of definitions) {
      this.tools.set(tool.name, tool);
    }
  }

  list() {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  async execute(name: string, args: unknown) {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new ToolExecutionError(`Unknown tool: ${name}`, "TOOL_NOT_FOUND");
    }

    try {
      const parsedArgs = tool.argsSchema.parse(args ?? {});
      return await tool.execute(parsedArgs);
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => issue.message).join(", ");
        throw new ToolExecutionError(`Invalid arguments: ${details}`, "INVALID_TOOL_ARGUMENTS");
      }

      if (error instanceof ToolExecutionError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new ToolExecutionError(error.message);
      }

      throw new ToolExecutionError("Unknown tool execution error.");
    }
  }
}

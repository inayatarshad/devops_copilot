import type { z } from "zod";

export interface ToolDefinition<TArgs = any, TResult = unknown> {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  argsSchema: z.ZodType<TArgs>;
  execute: (args: TArgs) => Promise<TResult>;
}

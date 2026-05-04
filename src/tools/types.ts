import type { z } from "zod";

export interface ToolDefinition<
  TParsedArgs = any,
  TResult = unknown,
  TInputArgs = TParsedArgs,
> {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  argsSchema: z.ZodType<TParsedArgs, z.ZodTypeDef, TInputArgs>;
  execute: (args: TParsedArgs) => Promise<TResult>;
}

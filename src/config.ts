import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

export const envSchema = z.object({
  GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN is required"),
  GITHUB_OWNER: z.string().min(1, "GITHUB_OWNER is required"),
  GITHUB_REPO: z.string().min(1, "GITHUB_REPO is required"),
});

export type AppConfig = z.infer<typeof envSchema>;

export function parseConfig(source: NodeJS.ProcessEnv): AppConfig {
  return envSchema.parse(source);
}

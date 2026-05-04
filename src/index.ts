import { ZodError } from "zod";
import { parseConfig } from "./config.js";
import { ConfigurationError } from "./errors.js";
import { log } from "./logger.js";
import { GitHubService } from "./services/github-service.js";
import { startStdioServer, createMcpServer } from "./server.js";
import { ToolRegistry } from "./tool-registry.js";
import { createGitHubTools } from "./tools/github-tools.js";

async function main() {
  const config = parseConfig(process.env);
  const githubService = GitHubService.fromConfig(config);
  const toolRegistry = new ToolRegistry(createGitHubTools(githubService));
  const server = createMcpServer(toolRegistry);

  await startStdioServer(server);
}

try {
  await main();
} catch (error) {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => issue.message).join(", ");
    const configurationError = new ConfigurationError(
      `Invalid environment configuration: ${details}`,
    );
    log("error", configurationError.message, { code: configurationError.code });
    process.exitCode = 1;
  } else if (error instanceof Error) {
    log("error", error.message);
    process.exitCode = 1;
  } else {
    log("error", "Unknown startup error");
    process.exitCode = 1;
  }
}

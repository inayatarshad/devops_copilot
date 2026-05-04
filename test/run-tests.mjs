import assert from "node:assert/strict";
import { RequestError } from "@octokit/request-error";
import { parseConfig } from "../dist/config.js";
import { ToolExecutionError } from "../dist/errors.js";
import { GitHubService } from "../dist/services/github-service.js";
import { ToolRegistry } from "../dist/tool-registry.js";
import { z } from "zod";

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await runTest("parseConfig returns validated config for complete environment", async () => {
  const result = parseConfig({
    GITHUB_TOKEN: "token",
    GITHUB_OWNER: "openai",
    GITHUB_REPO: "devops-copilot",
  });

  assert.equal(result.GITHUB_TOKEN, "token");
  assert.equal(result.GITHUB_OWNER, "openai");
  assert.equal(result.GITHUB_REPO, "devops-copilot");
});

await runTest("parseConfig throws when required values are missing", async () => {
  assert.throws(
    () =>
      parseConfig({
        GITHUB_TOKEN: "",
        GITHUB_OWNER: "openai",
        GITHUB_REPO: "",
      }),
    /required/,
  );
});

await runTest("ToolRegistry lists registered tools", async () => {
  const registry = new ToolRegistry([
    {
      name: "demo_tool",
      description: "Demo tool",
      inputSchema: { type: "object", properties: {} },
      argsSchema: z.object({}),
      execute: async () => ({ ok: true }),
    },
  ]);

  assert.deepEqual(registry.list(), [
    {
      name: "demo_tool",
      description: "Demo tool",
      inputSchema: { type: "object", properties: {} },
    },
  ]);
});

await runTest("ToolRegistry validates tool arguments and applies defaults", async () => {
  const registry = new ToolRegistry([
    {
      name: "create",
      description: "Create thing",
      inputSchema: { type: "object", properties: {} },
      argsSchema: z.object({
        title: z.string().min(1),
        base: z.string().default("main"),
      }),
      execute: async (args) => args,
    },
  ]);

  const result = await registry.execute("create", { title: "hello" });
  assert.deepEqual(result, { title: "hello", base: "main" });
});

await runTest("ToolRegistry wraps unknown tools in a typed error", async () => {
  const registry = new ToolRegistry([]);

  await assert.rejects(
    () => registry.execute("missing_tool", {}),
    (error) => error instanceof ToolExecutionError && error.code === "TOOL_NOT_FOUND",
  );
});

await runTest("GitHubService maps pull request summaries", async () => {
  const service = new GitHubService(
    {
      pulls: {
        list: async () => ({
          data: [
            {
              number: 7,
              title: "Improve CI",
              user: { login: "hp" },
              html_url: "https://github.com/openai/devops_copilot/pull/7",
              created_at: "2026-05-01T12:00:00Z",
            },
          ],
        }),
        create: async () => {
          throw new Error("not used");
        },
      },
    },
    "openai",
    "devops_copilot",
  );

  const result = await service.listPullRequests();

  assert.deepEqual(result, [
    {
      number: 7,
      title: "Improve CI",
      author: "hp",
      url: "https://github.com/openai/devops_copilot/pull/7",
      created: "2026-05-01T12:00:00Z",
    },
  ]);
});

await runTest("GitHubService maps GitHub validation failures to tool errors", async () => {
  const service = new GitHubService(
    {
      pulls: {
        list: async () => ({ data: [] }),
        create: async () => {
          throw new RequestError("Validation failed", 422, {
            request: {
              method: "POST",
              url: "https://api.github.com/repos/openai/devops_copilot/pulls",
              headers: {},
            },
          });
        },
      },
    },
    "openai",
    "devops_copilot",
  );

  await assert.rejects(
    () =>
      service.createPullRequest({
        title: "PR",
        body: "Body",
        head: "feature",
        base: "main",
      }),
    (error) =>
      error instanceof ToolExecutionError &&
      error.code === "GITHUB_VALIDATION_FAILED" &&
      /similar pull request/.test(error.message),
  );
});

console.log("All tests passed.");

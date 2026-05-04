# DevOps Copilot MCP Server

A small but production-minded Model Context Protocol (MCP) server that exposes GitHub pull request tools over stdio.

## What it does

- Lists open pull requests for a configured GitHub repository
- Creates a new pull request in that repository

## Architecture

- `src/index.ts`: startup and top-level error handling
- `src/server.ts`: MCP transport wiring
- `src/tool-registry.ts`: tool registration, validation, and dispatch
- `src/services/github-service.ts`: GitHub API business logic
- `src/tools/`: tool definitions and schemas
- `src/config.ts`: environment validation

This keeps transport concerns separate from validation and GitHub operations, which makes the server easier to extend and test.

## Required environment variables

Copy `.env.example` to `.env` and set:

```env
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_org_or_username
GITHUB_REPO=your_repository_name
```

## Scripts

- `npm run build` compiles TypeScript to `dist/`
- `npm run start` runs the compiled MCP server
- `npm run typecheck` performs a no-output TypeScript check
- `npm run test` builds and runs the test suite
- `npm run ci` runs the local CI-equivalent checks

## Development notes

- Source files live in `src/`
- Build output should only live in `dist/`
- The server communicates through stdio, so it is meant to be launched by an MCP client
- CI is defined in `.github/workflows/ci.yml`

## Extending the server

To add a new MCP tool:

1. Add the business logic to a service or helper module.
2. Define the tool schema and handler in `src/tools/`.
3. Register it through the tool factory used by `ToolRegistry`.

That pattern keeps each tool typed, validated, and independently testable.

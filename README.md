# DevOps Copilot MCP Server

A small Model Context Protocol (MCP) server that exposes GitHub pull request tools over stdio.

## What it does

- Lists open pull requests for a configured GitHub repository
- Creates a new pull request in that repository

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

## Development notes

- Source files live in `src/`
- Build output should only live in `dist/`
- The server communicates through stdio, so it is meant to be launched by an MCP client

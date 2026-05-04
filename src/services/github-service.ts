import { Octokit } from "@octokit/rest";
import { RequestError } from "@octokit/request-error";
import type { AppConfig } from "../config.js";
import { ToolExecutionError } from "../errors.js";

export interface PullRequestSummary {
  number: number;
  title: string;
  author: string | undefined;
  url: string;
  created: string;
}

export interface CreatedPullRequest {
  number: number;
  url: string;
  state: string;
}

export interface CreatePullRequestInput {
  title: string;
  body: string;
  head: string;
  base: string;
}

export interface GitHubPullsClient {
  pulls: {
    list(params: {
      owner: string;
      repo: string;
      state: "open";
    }): Promise<{
      data: Array<{
        number: number;
        title: string;
        user?: { login?: string | undefined } | null;
        html_url: string;
        created_at: string;
      }>;
    }>;
    create(params: {
      owner: string;
      repo: string;
      title: string;
      body: string;
      head: string;
      base: string;
    }): Promise<{
      data: {
        number: number;
        html_url: string;
        state: string;
      };
    }>;
  };
}

export class GitHubService {
  constructor(
    private readonly client: GitHubPullsClient,
    private readonly owner: string,
    private readonly repo: string,
  ) {}

  static fromConfig(appConfig: AppConfig): GitHubService {
    const client = new Octokit({
      auth: appConfig.GITHUB_TOKEN,
    });

    return new GitHubService(client, appConfig.GITHUB_OWNER, appConfig.GITHUB_REPO);
  }

  async listPullRequests(): Promise<PullRequestSummary[]> {
    try {
      const { data } = await this.client.pulls.list({
        owner: this.owner,
        repo: this.repo,
        state: "open",
      });

      return data.map((pr) => ({
        number: pr.number,
        title: pr.title,
        author: pr.user?.login,
        url: pr.html_url,
        created: pr.created_at,
      }));
    } catch (error) {
      throw this.toToolExecutionError(error);
    }
  }

  async createPullRequest(input: CreatePullRequestInput): Promise<CreatedPullRequest> {
    try {
      const { data } = await this.client.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: input.title,
        body: input.body,
        head: input.head,
        base: input.base,
      });

      return {
        number: data.number,
        url: data.html_url,
        state: data.state,
      };
    } catch (error) {
      throw this.toToolExecutionError(error);
    }
  }

  private toToolExecutionError(error: unknown): ToolExecutionError {
    if (error instanceof RequestError) {
      if (error.status === 401) {
        return new ToolExecutionError(
          "GitHub authentication failed. Check that GITHUB_TOKEN is valid.",
          "GITHUB_AUTH_FAILED",
        );
      }

      if (error.status === 404) {
        return new ToolExecutionError(
          `GitHub repository not found: ${this.owner}/${this.repo}. Check GITHUB_OWNER and GITHUB_REPO.`,
          "GITHUB_REPO_NOT_FOUND",
        );
      }

      if (error.status === 422) {
        return new ToolExecutionError(
          "GitHub rejected the request. Check whether the branch names are valid and whether a similar pull request already exists.",
          "GITHUB_VALIDATION_FAILED",
        );
      }

      return new ToolExecutionError(
        `GitHub API request failed with status ${error.status}.`,
        "GITHUB_API_ERROR",
      );
    }

    if (error instanceof Error) {
      return new ToolExecutionError(error.message);
    }

    return new ToolExecutionError("Unknown GitHub integration error.", "GITHUB_UNKNOWN_ERROR");
  }
}

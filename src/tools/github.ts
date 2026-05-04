import { Octokit } from "@octokit/rest";
import { RequestError } from "@octokit/request-error";
import { config } from "../config.js";
import { ToolExecutionError } from "../errors.js";

const octokit = new Octokit({
  auth: config.GITHUB_TOKEN,
});

const owner = config.GITHUB_OWNER;
const repo = config.GITHUB_REPO;

function toToolExecutionError(error: unknown): ToolExecutionError {
  if (error instanceof RequestError) {
    if (error.status === 401) {
      return new ToolExecutionError(
        "GitHub authentication failed. Check that GITHUB_TOKEN is valid.",
      );
    }

    if (error.status === 404) {
      return new ToolExecutionError(
        `GitHub repository not found: ${owner}/${repo}. Check GITHUB_OWNER and GITHUB_REPO.`,
      );
    }

    if (error.status === 422) {
      return new ToolExecutionError(
        "GitHub rejected the request. Check whether the branch names are valid and whether a similar pull request already exists.",
      );
    }

    return new ToolExecutionError(
      `GitHub API request failed with status ${error.status}.`,
    );
  }

  if (error instanceof Error) {
    return new ToolExecutionError(error.message);
  }

  return new ToolExecutionError("Unknown GitHub integration error.");
}

export async function github_list_prs() {
  try {
    const { data } = await octokit.pulls.list({
      owner,
      repo,
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
    throw toToolExecutionError(error);
  }
}

export async function github_create_pr(
  title: string,
  body: string,
  head: string,
  base: string = "main",
) {
  try {
    const { data } = await octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base,
    });

    return {
      number: data.number,
      url: data.html_url,
      state: data.state,
    };
  } catch (error) {
    throw toToolExecutionError(error);
  }
}

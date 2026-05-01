import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_OWNER!;
const repo  = process.env.GITHUB_REPO!;

// Tool 1: List open PRs
export async function github_list_prs() {
  const { data } = await octokit.pulls.list({
    owner, repo, state: "open",
  });
  return data.map(pr => ({
    number:  pr.number,
    title:   pr.title,
    author:  pr.user?.login,
    url:     pr.html_url,
    created: pr.created_at,
  }));
}

// Tool 2: Create a PR
export async function github_create_pr(
  title: string,
  body:  string,
  head:  string,
  base:  string = "main"
) {
  const { data } = await octokit.pulls.create({
    owner, repo, title, body, head, base,
  });
  return {
    number: data.number,
    url:    data.html_url,
    state:  data.state,
  };
}
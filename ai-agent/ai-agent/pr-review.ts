import { agent } from "./agent";

export async function reviewPullRequest() {
  const prTitle = process.env.PR_TITLE || "";
  const prBody = process.env.PR_BODY || "";

  const review = await agent.codeReview(`
Pull Request Title:

${prTitle}

Pull Request Body:

${prBody}
`);

  console.log(review);

  return review;
}

reviewPullRequest();

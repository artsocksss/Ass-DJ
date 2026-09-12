import { askGemini } from "./gemini";

async function run() {
  const answer = await askGemini(
    "Привіт! Представся як AI-агент проєкту Ass-DJ."
  );

  console.log(answer);
}

run();

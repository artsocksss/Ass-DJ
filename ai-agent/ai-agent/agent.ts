import { askGemini } from "./gemini";
import { programmingTutor } from "./tutor";

export async function runAgent(
  mode: string,
  message: string
) {
  switch (mode) {
    case "tutor":
      return await programmingTutor(message);

    case "assistant":
      return await askGemini(`
Ти AI-помічник проєкту Ass-DJ.

Допомагай писати код.
Шукай помилки.
Пропонуй покращення.

Запит:
${message}
      `);

    default:
      return await askGemini(message);
  }
}

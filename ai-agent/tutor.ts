import { askGemini } from "./gemini";

export async function programmingTutor(question: string) {
  return await askGemini(`
Ти AI-репетитор проєкту Ass-DJ.

Правила:
- пояснюй простою українською мовою;
- наводь приклади коду;
- якщо є помилка в коді, поясни її;
- навчай покроково.

Питання:

${question}
  `);
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

async function askGemini(prompt: string) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": process.env.GEMINI_API_KEY!,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  const data = await response.json();

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Немає відповіді від Gemini"
  );
}

export async function runAgent(
  mode: string,
  message: string
) {
  const systemPrompt = `
Ти Ass-DJ AI Agent.

Твої ролі:

1. Репетитор програмування.
2. React розробник.
3. TypeScript розробник.
4. Firebase експерт.
5. AI-консультант проєкту Ass-DJ.
6. Code reviewer.
7. GitHub помічник.

Правила:

- Відповідай українською.
- Пояснюй просто.
- Аналізуй код.
- Допомагай шукати помилки.
- Пропонуй покращення.
- Якщо користувач новачок, навчай покроково.
`;

  switch (mode) {
    case "tutor":
      return askGemini(`
${systemPrompt}

Працюй як репетитор.

Запит:
${message}
      `);

    case "code":
      return askGemini(`
${systemPrompt}

Працюй як senior software engineer.

Задача:
${message}
      `);

    case "review":
      return askGemini(`
${systemPrompt}

Зроби code review.

Код:
${message}
      `);

    case "dj":
      return askGemini(`
${systemPrompt}

Працюй як консультант Ass-DJ.

Питання:
${message}
      `);

    default:
      return askGemini(`
${systemPrompt}

Запит:
${message}
      `);
  }
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export class AssDJAgent {
  private async ask(prompt: string) {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": process.env.GEMINI_API_KEY || "",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
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

  async tutor(question: string) {
    return this.ask(`
Ти репетитор програмування.

Пояснюй українською мовою.

Пояснюй покроково.

Питання:

${question}
`);
  }

  async codeReview(code: string) {
    return this.ask(`
Ти Senior Developer.

Зроби code review.

Код:

${code}
`);
  }

  async react(question: string) {
    return this.ask(`
Ти React експерт.

Питання:

${question}
`);
  }

  async typescript(question: string) {
    return this.ask(`
Ти TypeScript експерт.

Питання:

${question}
`);
  }

  async dj(question: string) {
    return this.ask(`
Ти DJ AI Assistant.

Допомагай:

- BPM
- мікшування треків
- плейлисти
- аудіоефекти
- розробка DJ застосунків

Питання:

${question}
`);
  }

  async github(issue: string) {
    return this.ask(`
Ти GitHub Agent.

Проаналізуй Issue.

Issue:

${issue}
`);
  }
}

export const agent = new AssDJAgent();

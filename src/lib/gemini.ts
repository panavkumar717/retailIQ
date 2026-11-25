export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

const GEMINI_TEXT_MODELS = [
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-3.8-flash-lite",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callGeminiJson(
  apiKey: string,
  parts: GeminiPart[],
  temperature = 0.1
): Promise<{ ok: true; data: unknown; model: string } | { ok: false; status: number; error: string }> {
  let lastStatus = 502;
  let lastError = "Gemini API request failed.";

  for (const model of GEMINI_TEXT_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
            apiKey
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature,
              },
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          const rawText =
            result?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          return { ok: true, data: JSON.parse(rawText), model };
        }

        lastStatus = response.status;
        const errText = await response.text();
        lastError = `Gemini API (${model}) returned ${response.status}: ${errText.slice(0, 180)}`;

        // Retry on 503 / 429; move to next model on 404 or persistent 503
        if (response.status === 503 || response.status === 429) {
          if (attempt === 0) {
            await sleep(900);
            continue;
          }
          break;
        }
        if (response.status === 404) {
          break;
        }

        return { ok: false, status: response.status, error: lastError };
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Network error calling Gemini API";
        if (attempt === 0) {
          await sleep(800);
        }
      }
    }
  }

  return {
    ok: false,
    status: lastStatus,
    error:
      lastStatus === 503
        ? "AI service is temporarily busy across available models. Please wait a few seconds and try again, or fill in the fields manually."
        : lastError,
  };
}

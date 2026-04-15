import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt } from "./prompts";
import { DocSettings } from "./types";

export async function generateDocumentation(
  apiKey: string,
  rawInput: string,
  settings: DocSettings,
  userPrompt?: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(settings);
  // Truncate input to ~30K chars (~8K tokens) to avoid quota/rate limit issues
  const truncatedInput = rawInput.length > 30000
    ? rawInput.slice(0, 30000) + "\n\n[... content truncated for length ...]"
    : rawInput;

  const userInstruction = userPrompt?.trim()
    ? `\n\n## User Instructions\n\n${userPrompt.trim()}`
    : "";

  const fullPrompt = `${systemPrompt}${userInstruction}\n\n---\n\n## Source Material\n\n${truncatedInput}`;

  if (settings.provider === "openrouter") {
    return generateViaOpenRouter(apiKey, fullPrompt, settings.openrouterModel);
  }

  return generateViaGemini(apiKey, fullPrompt, settings.geminiModel);
}

async function generateViaGemini(
  apiKey: string,
  prompt: string,
  model: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model || "gemini-2.0-flash-lite",
  });

  const result = await geminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
  });

  return result.response.text();
}

async function generateViaOpenRouter(
  apiKey: string,
  prompt: string,
  model: string
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://docforge.app",
      "X-Title": "DocForge",
    },
    body: JSON.stringify({
      model: model || "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `OpenRouter error: ${res.status} ${res.statusText}`
    );
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No content generated.";
}

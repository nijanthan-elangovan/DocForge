import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatMessage } from "@/lib/types";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are DocForge Assistant — an expert code analyst and technical writer embedded inside a documentation tool.

The user has loaded source code or project content. Your job is to answer questions about that codebase: explain how things work, identify features, clarify architecture, suggest improvements, or help with anything related to the loaded content.

Rules:
- Be concise and direct. Use code snippets when helpful.
- Reference specific files and functions from the loaded source when answering.
- If the user asks something unrelated to the loaded content, politely redirect.
- Use markdown formatting for readability.`;

export async function POST(req: NextRequest) {
  try {
    const { apiKey, provider, model, messages, sourceContext } = (await req.json()) as {
      apiKey: string;
      provider: "gemini" | "openrouter";
      model: string;
      messages: ChatMessage[];
      sourceContext: string;
    };

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    // Truncate source to fit in context
    const truncatedSource =
      sourceContext.length > 60000
        ? sourceContext.slice(0, 60000) + "\n\n[... truncated ...]"
        : sourceContext;

    const contextBlock = `${SYSTEM_PROMPT}\n\n## Loaded Source Content\n\n${truncatedSource}`;

    if (provider === "openrouter") {
      return handleOpenRouter(apiKey, model, contextBlock, messages);
    }

    return handleGemini(apiKey, model, contextBlock, messages);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chat request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[]
) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model || "gemini-2.0-flash-lite",
  });

  // Build Gemini conversation history
  const contents = [
    { role: "user" as const, parts: [{ text: systemPrompt + "\n\nAcknowledge that you've loaded the source and are ready to help." }] },
    { role: "model" as const, parts: [{ text: "I've loaded the source content and I'm ready to answer your questions about this codebase. What would you like to know?" }] },
    ...messages.map((m) => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      parts: [{ text: m.content }],
    })),
  ];

  const result = await geminiModel.generateContent({
    contents,
    generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
  });

  return NextResponse.json({ reply: result.response.text() });
}

async function handleOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[]
) {
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
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.4,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenRouter error: ${res.status}`);
  }

  const data = await res.json();
  return NextResponse.json({
    reply: data.choices?.[0]?.message?.content || "No response generated.",
  });
}

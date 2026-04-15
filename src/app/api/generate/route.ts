import { NextRequest, NextResponse } from "next/server";
import { generateDocumentation } from "@/lib/gemini";
import { DocSettings } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, rawInput, userPrompt, settings } = body as {
      apiKey: string;
      rawInput: string;
      userPrompt?: string;
      settings: DocSettings;
    };

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is required" },
        { status: 400 }
      );
    }

    if (!rawInput?.trim()) {
      return NextResponse.json(
        { error: "Input content is required" },
        { status: 400 }
      );
    }

    const markdown = await generateDocumentation(apiKey, rawInput, settings, userPrompt);

    return NextResponse.json({ markdown });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    console.error("Generation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

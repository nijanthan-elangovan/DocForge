import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export async function POST(req: NextRequest) {
  try {
    const { markdown, title } = await req.json();

    if (!markdown) {
      return NextResponse.json(
        { error: "No content to share" },
        { status: 400 }
      );
    }

    const id = generateId();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error } = await supabase.from("shared_docs").insert({
      id,
      title: title || "Untitled",
      markdown,
      expires_at: expiresAt,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id });
  } catch {
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Document ID is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("shared_docs")
    .select("markdown, title, created_at, expires_at")
    .eq("id", id)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Document not found or expired" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    markdown: data.markdown,
    title: data.title,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  });
}

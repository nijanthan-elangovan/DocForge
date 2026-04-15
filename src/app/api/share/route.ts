import { NextRequest, NextResponse } from "next/server";

// Simple KV using a global Map — works per-instance on Netlify serverless.
// For production persistence, swap with a database or KV store.
// This is acceptable for demo/MVP — shared links last until the function cold-starts.
const sharedDocs = new Map<string, { markdown: string; title: string; createdAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { markdown, title } = await req.json();

    if (!markdown) {
      return NextResponse.json({ error: "No content to share" }, { status: 400 });
    }

    const id = generateId();
    sharedDocs.set(id, { markdown, title: title || "Untitled", createdAt: Date.now() });

    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id || !sharedDocs.has(id)) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(sharedDocs.get(id));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

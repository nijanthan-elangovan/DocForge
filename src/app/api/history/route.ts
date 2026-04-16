import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Save a generated article
export async function POST(req: NextRequest) {
  try {
    const { title, markdown, sourcePreview, settings } = await req.json();

    if (!markdown) {
      return NextResponse.json({ error: "No content to save" }, { status: 400 });
    }

    const ip = getClientIp(req);
    const id = generateId();

    const { error } = await supabase.from("article_history").insert({
      id,
      ip_address: ip,
      title: title || "Untitled",
      markdown,
      source_preview: sourcePreview?.slice(0, 200) || null,
      settings: settings || null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) {
      console.error("Save article error:", error);
      return NextResponse.json({ error: "Failed to save article" }, { status: 500 });
    }

    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "Failed to save article" }, { status: 500 });
  }
}

// Get article history for current IP
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const articleId = req.nextUrl.searchParams.get("id");

  // Fetch a single article by ID
  if (articleId) {
    const { data, error } = await supabase
      .from("article_history")
      .select("*")
      .eq("id", articleId)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article: data });
  }

  // Fetch all articles for this IP
  const { data, error } = await supabase
    .from("article_history")
    .select("id, title, source_preview, created_at, expires_at")
    .eq("ip_address", ip)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Fetch history error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }

  return NextResponse.json({ articles: data || [] });
}

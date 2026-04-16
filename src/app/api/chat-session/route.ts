import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function generateId(): string {
  return "chat-" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Save or update a chat session
export async function POST(req: NextRequest) {
  try {
    const { sessionId, title, messages, sourcePreview } = await req.json();
    const ip = getClientIp(req);

    // Update existing session
    if (sessionId) {
      const { error } = await supabase
        .from("chat_sessions")
        .update({
          messages,
          title: title || "Chat Session",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .eq("ip_address", ip);

      if (error) {
        console.error("Update chat error:", error);
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
      }

      return NextResponse.json({ id: sessionId });
    }

    // Create new session
    const id = generateId();
    const { error } = await supabase.from("chat_sessions").insert({
      id,
      ip_address: ip,
      title: title || "Chat Session",
      messages: messages || [],
      source_preview: sourcePreview?.slice(0, 200) || null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) {
      console.error("Create chat error:", error);
      return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
    }

    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "Failed to save chat session" }, { status: 500 });
  }
}

// Get chat sessions for current IP, or a specific session
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const sessionId = req.nextUrl.searchParams.get("id");

  if (sessionId) {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session: data });
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, title, source_preview, updated_at, expires_at")
    .eq("ip_address", ip)
    .gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Fetch chats error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }

  return NextResponse.json({ sessions: data || [] });
}

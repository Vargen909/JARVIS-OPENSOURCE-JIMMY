import { NextRequest, NextResponse } from "next/server";

// Mock data for B.O.B - This allows the app to work without the Python backend
const mockInfo = {
  name: "B.O.B",
  version: "0.2.0",
  ok: true,
  needs_onboarding: false,
  features: ["chat", "voice", "memory"],
  uptime: 3600,
};

const mockUsers = [
  {
    id: "user-1",
    name: "Demo User",
    email: "demo@example.com",
    avatar: null,
    created_at: new Date().toISOString(),
  },
];

const mockConversations: Record<string, unknown>[] = [];

const mockSettings = {
  theme: "dark",
  language: "en",
  voice_enabled: true,
  notifications: true,
};

// In-memory message store for demo
let messageHistory: { role: string; content: string; timestamp: string }[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = "/" + path.join("/");

  console.log("[v0] Mock API GET:", endpoint);

  // Route to appropriate mock data
  if (endpoint === "/" || endpoint === "") {
    return NextResponse.json({ name: "B.O.B", version: "0.2.0", ok: true });
  }

  if (endpoint === "/info") {
    return NextResponse.json(mockInfo);
  }

  if (endpoint === "/users" || endpoint === "/users/") {
    return NextResponse.json(mockUsers);
  }

  if (endpoint.startsWith("/users/")) {
    return NextResponse.json(mockUsers[0]);
  }

  if (endpoint === "/conversations" || endpoint === "/conversations/") {
    return NextResponse.json(mockConversations);
  }

  if (endpoint === "/settings" || endpoint === "/settings/") {
    return NextResponse.json(mockSettings);
  }

  if (endpoint === "/messages" || endpoint === "/messages/") {
    return NextResponse.json(messageHistory);
  }

  // Default 404
  return NextResponse.json({ error: "Not found", endpoint }, { status: 404 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = "/" + path.join("/");

  console.log("[v0] Mock API POST:", endpoint);

  try {
    const body = await request.json().catch(() => ({}));

    if (endpoint === "/chat" || endpoint === "/chat/") {
      const userMessage = body.message || body.content || "Hello";
      
      // Add user message to history
      messageHistory.push({
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      });

      // Generate mock response
      const responses = [
        "Hello! I'm B.O.B, your Backend Orchestration Bot. How can I help you today?",
        "That's an interesting question! Let me think about that...",
        "I'm here to assist you. What would you like to know?",
        "Great question! Here's what I can tell you...",
      ];
      const botResponse = responses[Math.floor(Math.random() * responses.length)];

      // Add bot response to history
      messageHistory.push({
        role: "assistant",
        content: botResponse,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        response: botResponse,
        message: botResponse,
        role: "assistant",
        timestamp: new Date().toISOString(),
      });
    }

    if (endpoint === "/users" || endpoint === "/users/") {
      const newUser = {
        id: `user-${Date.now()}`,
        name: body.name || "New User",
        email: body.email || "user@example.com",
        avatar: null,
        created_at: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      return NextResponse.json(newUser, { status: 201 });
    }

    if (endpoint === "/conversations" || endpoint === "/conversations/") {
      const newConv = {
        id: `conv-${Date.now()}`,
        title: body.title || "New Conversation",
        created_at: new Date().toISOString(),
        messages: [],
      };
      mockConversations.push(newConv);
      return NextResponse.json(newConv, { status: 201 });
    }

    return NextResponse.json({ success: true, received: body });
  } catch (error) {
    console.error("[v0] Mock API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = "/" + path.join("/");

  console.log("[v0] Mock API PATCH:", endpoint);

  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ success: true, updated: body });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = "/" + path.join("/");

  console.log("[v0] Mock API DELETE:", endpoint);

  return NextResponse.json({ success: true, deleted: endpoint });
}

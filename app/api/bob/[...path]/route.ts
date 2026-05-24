import { NextRequest, NextResponse } from "next/server";

// Mock engine - matches EngineInfo type
const mockEngine = {
  id: "mock-engine",
  label: "Demo Engine",
  provider: "mock",
  requires_key: false,
  models: [
    {
      id: "mock-model-1",
      label: "Demo Model",
      good_for: "General conversation",
      installed: true,
    },
  ],
  default_model: "mock-model-1",
  privacy: "local" as const,
  available: true,
  description: "A demo engine for testing",
  good_for: "Testing and demonstration",
};

// Mock user - matches UserOut type exactly
const mockUser = {
  id: 1,
  name: "Demo User",
  role: "admin" as const,
  language: "en",
  security: "balanced" as const,
  operating_mode: "personal" as const,
  performance_mode: "balanced" as const,
  preferred_engine: "mock-engine",
  preferred_model: "mock-model-1",
  child_age_band: null,
  onboarded: true,
  has_pin: false,
  profile: null,
  created_at: new Date().toISOString(),
};

// Mock app info - matches AppInfo type
const mockInfo = {
  name: "B.O.B",
  version: "0.2.0",
  user_count: 1,
  needs_onboarding: false,
  engines: [mockEngine],
};

// In-memory stores
let users = [mockUser];
let conversations: Record<number, { id: number; title: string; operating_mode: string; confidential: boolean; created_at: string; updated_at: string; messages: { id: number; role: string; content: string; engine: string | null; model: string | null; created_at: string }[] }> = {};
let conversationIdCounter = 1;
let messageIdCounter = 1;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = "/" + path.join("/");

  console.log("[v0] Mock API GET:", endpoint);

  // Root endpoint
  if (endpoint === "/" || endpoint === "") {
    return NextResponse.json({ name: "B.O.B", version: "0.2.0", ok: true });
  }

  // App info
  if (endpoint === "/info") {
    return NextResponse.json(mockInfo);
  }

  // Engines list
  if (endpoint === "/engines" || endpoint === "/engines/") {
    return NextResponse.json([mockEngine]);
  }

  // Users list
  if (endpoint === "/users" || endpoint === "/users/") {
    return NextResponse.json(users);
  }

  // Single user
  const userMatch = endpoint.match(/^\/users\/(\d+)$/);
  if (userMatch) {
    const userId = parseInt(userMatch[1]);
    const user = users.find((u) => u.id === userId);
    if (user) return NextResponse.json(user);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // User conversations
  const userConvMatch = endpoint.match(/^\/users\/(\d+)\/conversations$/);
  if (userConvMatch) {
    const userId = parseInt(userConvMatch[1]);
    const userConvs = Object.values(conversations);
    return NextResponse.json(userConvs);
  }

  // Single conversation
  const convMatch = endpoint.match(/^\/conversations\/(\d+)$/);
  if (convMatch) {
    const convId = parseInt(convMatch[1]);
    const conv = conversations[convId];
    if (conv) return NextResponse.json(conv);
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // User memory
  const memoryMatch = endpoint.match(/^\/users\/(\d+)\/memory$/);
  if (memoryMatch) {
    return NextResponse.json([]);
  }

  // API keys
  if (endpoint === "/api-keys") {
    return NextResponse.json([]);
  }

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

    // Chat endpoint
    if (endpoint === "/chat" || endpoint === "/chat/") {
      const userId = body.user_id || 1;
      let convId = body.conversation_id;
      const userMessage = body.message || "Hello";

      // Create new conversation if needed
      if (!convId || !conversations[convId]) {
        convId = conversationIdCounter++;
        conversations[convId] = {
          id: convId,
          title: userMessage.slice(0, 50),
          operating_mode: body.operating_mode || "personal",
          confidential: body.confidential || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: [],
        };
      }

      // Add user message
      const userMsg = {
        id: messageIdCounter++,
        role: "user" as const,
        content: userMessage,
        engine: null,
        model: null,
        created_at: new Date().toISOString(),
      };
      conversations[convId].messages.push(userMsg);

      // Generate response
      const responses = [
        "Hello! I'm B.O.B, your Backend Orchestration Bot. How can I help you today?",
        "That's an interesting question! Let me think about that...",
        "I'm here to assist you. What would you like to know?",
        "Great question! Here's what I can tell you...",
      ];
      const botContent = responses[Math.floor(Math.random() * responses.length)];

      const botMsg = {
        id: messageIdCounter++,
        role: "assistant" as const,
        content: botContent,
        engine: "mock-engine",
        model: "mock-model-1",
        created_at: new Date().toISOString(),
      };
      conversations[convId].messages.push(botMsg);
      conversations[convId].updated_at = new Date().toISOString();

      // Return ChatResponse type
      return NextResponse.json({
        conversation_id: convId,
        reply: botMsg,
        engine_used: "mock-engine",
        model_used: "mock-model-1",
        actions: [],
      });
    }

    // Create user
    if (endpoint === "/users" || endpoint === "/users/") {
      const newUser = {
        id: users.length + 1,
        name: body.name || "New User",
        role: body.role || "standard",
        language: body.language || "en",
        security: body.security || "balanced",
        operating_mode: "personal" as const,
        performance_mode: "balanced" as const,
        preferred_engine: "mock-engine",
        preferred_model: "mock-model-1",
        child_age_band: body.child_age_band || null,
        onboarded: false,
        has_pin: !!body.pin,
        profile: null,
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      return NextResponse.json(newUser, { status: 201 });
    }

    // Reload settings
    if (endpoint === "/settings/reload") {
      return NextResponse.json({
        ok: true,
        engines: [
          {
            id: "mock-engine",
            label: "Demo Engine",
            provider: "mock",
            requires_key: false,
            configured: true,
          },
        ],
        engine_count: 1,
        configured_count: 1,
      });
    }

    // Test engine
    const engineTestMatch = endpoint.match(/^\/engines\/(.+)\/test$/);
    if (engineTestMatch) {
      return NextResponse.json({
        ok: true,
        engine_id: engineTestMatch[1],
        available: true,
        message: "Engine is working correctly",
      });
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

    // Update user
    const userMatch = endpoint.match(/^\/users\/(\d+)$/);
    if (userMatch) {
      const userId = parseInt(userMatch[1]);
      const userIndex = users.findIndex((u) => u.id === userId);
      if (userIndex >= 0) {
        users[userIndex] = { ...users[userIndex], ...body };
        return NextResponse.json(users[userIndex]);
      }
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

  // Delete conversation
  const convMatch = endpoint.match(/^\/conversations\/(\d+)$/);
  if (convMatch) {
    const convId = parseInt(convMatch[1]);
    delete conversations[convId];
    return new NextResponse(null, { status: 204 });
  }

  // Delete user
  const userMatch = endpoint.match(/^\/users\/(\d+)$/);
  if (userMatch) {
    const userId = parseInt(userMatch[1]);
    users = users.filter((u) => u.id !== userId);
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, { status: 204 });
}

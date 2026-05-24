import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BOB_BACKEND_URL || "http://127.0.0.1:8765";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = "/" + params.path.join("/");
  const url = new URL(request.url);
  const queryString = url.search;
  
  try {
    const res = await fetch(`${BACKEND_URL}${path}${queryString}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[v0] Backend proxy error:", error);
    return NextResponse.json(
      { error: "Backend not available", detail: String(error) },
      { status: 503 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = "/" + params.path.join("/");
  
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: BodyInit | undefined;
    let headers: Record<string, string> = {};
    
    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
    } else {
      body = await request.text();
      headers["Content-Type"] = "application/json";
    }
    
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });
    
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[v0] Backend proxy error:", error);
    return NextResponse.json(
      { error: "Backend not available", detail: String(error) },
      { status: 503 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = "/" + params.path.join("/");
  
  try {
    const body = await request.text();
    
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
    
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[v0] Backend proxy error:", error);
    return NextResponse.json(
      { error: "Backend not available", detail: String(error) },
      { status: 503 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = "/" + params.path.join("/");
  
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[v0] Backend proxy error:", error);
    return NextResponse.json(
      { error: "Backend not available", detail: String(error) },
      { status: 503 }
    );
  }
}

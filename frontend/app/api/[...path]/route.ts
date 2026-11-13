import type { NextRequest } from "next/server";

/**
 * Same-origin proxy: the browser calls /api/*, this forwards to the FastAPI backend.
 * BACKEND_URL is read at runtime, so one Docker image works on any server (no CORS,
 * no build-time API URL).
 */
export const dynamic = "force-dynamic";

const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/$/, "");

type RouteContext = { params: Promise<{ path: string[] }> };

const proxy = async (request: NextRequest, { params }: RouteContext) => {
  const { path } = await params;
  const target = `${BACKEND_URL}/api/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: { "content-type": request.headers.get("content-type") ?? "application/json" },
      body: hasBody ? await request.text() : undefined,
      signal: request.signal,
      cache: "no-store",
    });
    const body = upstream.status === 204 ? null : upstream.body;
    return new Response(body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json({ detail: "The assistant service is unavailable right now." }, { status: 502 });
  }
};

export { proxy as GET, proxy as POST, proxy as DELETE };

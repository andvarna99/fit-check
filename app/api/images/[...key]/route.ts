import { cookies } from "next/headers";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { getObject, isValidKey } from "@/lib/storage";

// Serves private item photos to the signed-in user. Keys are unique per upload,
// so responses can be cached by the browser indefinitely (but never by shared caches).
export async function GET(request: Request, ctx: RouteContext<"/api/images/[...key]">) {
  const cookieStore = await cookies();
  if (!(await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const key = (await ctx.params).key.join("/");
  if (!isValidKey(key)) return new Response("Not found", { status: 404 });

  const object = await getObject(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": object.contentType,
    "Cache-Control": "private, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  if (object.etag) {
    headers.set("ETag", object.etag);
    if (request.headers.get("if-none-match") === object.etag) {
      return new Response(null, { status: 304, headers });
    }
  }
  if (object.size !== null) headers.set("Content-Length", String(object.size));

  return new Response(object.body as BodyInit, { headers });
}

/** Small helpers shared by all API functions. */

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, string>) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) => Response.json(data, { status });

export const noContent = () => new Response(null, { status: 204 });

/** Wraps a handler so thrown HttpErrors (and unexpected errors) become JSON error responses. */
export function handle(fn: (req: Request, id: number | null) => Promise<Response>) {
  return async (req: Request, context: { params: Record<string, string | undefined> }) => {
    try {
      const raw = context.params?.id;
      let id: number | null = null;
      if (raw !== undefined) {
        id = Number(raw);
        if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Invalid id");
      }
      return await fn(req, id);
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ error: err.message, ...(err.details ? { details: err.details } : {}) }, err.status);
      }
      console.error(err);
      return json({ error: "Internal server error" }, 500);
    }
  };
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "Request body must be a JSON object");
  }
}

export const methodNotAllowed = () => new HttpError(405, "Method not allowed");

/** Returns "YYYY-MM-DD" bounds for a "YYYY-MM" month string. */
export function monthRange(month: string): { start: string; end: string } {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new HttpError(400, "month must be in YYYY-MM format");
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return { start: `${month}-01`, end: `${next}-01` };
}

export const currentMonth = () => new Date().toISOString().slice(0, 7);

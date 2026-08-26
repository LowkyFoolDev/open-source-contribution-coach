import { desc } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { notes } from "../../../db/schema";

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10_000;

// Database and runtime errors can carry schema or configuration details, so only
// the known setup hint is returned to clients; everything else stays in the logs.
function toRouteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const detail =
    error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${message}\n${detail}`;

  console.error("notes route failed", error);

  if (combined.includes("no such table") || combined.includes('from "notes"')) {
    return "The notes table is unavailable. Generate the migration locally with `npm run db:generate`, then deploy so the platform can apply the generated SQL to the real D1 database.";
  }

  return "Unexpected error";
}

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(notes)
      .orderBy(desc(notes.createdAt), desc(notes.id))
      .limit(20);

    return Response.json({ notes: rows });
  } catch (error) {
    return Response.json(
      { error: toRouteErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    if (typeof payload !== "object" || payload === null) {
      return Response.json({ error: "body must be a JSON object" }, { status: 400 });
    }

    const { title: rawTitle, content: rawContent } = payload as Record<string, unknown>;
    if (rawTitle !== undefined && typeof rawTitle !== "string") {
      return Response.json({ error: "title must be a string" }, { status: 400 });
    }
    if (rawContent !== undefined && typeof rawContent !== "string") {
      return Response.json({ error: "content must be a string" }, { status: 400 });
    }

    const title = rawTitle?.trim() ?? "";
    const content = rawContent?.trim() ?? "";

    if (!title) {
      return Response.json({ error: "title is required" }, { status: 400 });
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return Response.json(
        { error: `title must be at most ${MAX_TITLE_LENGTH} characters` },
        { status: 400 }
      );
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return Response.json(
        { error: `content must be at most ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const db = getDb();
    const [note] = await db.insert(notes).values({ title, content }).returning();
    return Response.json({ note }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: toRouteErrorMessage(error) },
      { status: 500 }
    );
  }
}

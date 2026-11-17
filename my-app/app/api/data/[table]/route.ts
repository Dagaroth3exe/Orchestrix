import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/server/mongo";
import { TABLES, type TableName } from "@/lib/server/models";
import { currentUser } from "@/lib/server/session";

/**
 * One data endpoint for notes, tasks and alerts. Every query is forced to the
 * signed-in user's documents; only whitelisted fields can be filtered,
 * sorted or written.
 */

type Filter = { col: string; op: "eq" | "in"; value: unknown };
type Query = {
  op: "select" | "insert" | "update" | "delete";
  filters?: Filter[];
  order?: { col: string; asc: boolean } | null;
  limit?: number | null;
  single?: boolean;
  head?: boolean;
  count?: boolean;
  payload?: Record<string, unknown>;
};

const fail = (error: string, status: number) => NextResponse.json({ data: null, error: { message: error }, count: null }, { status });

function pick(src: Record<string, unknown> | undefined, allowed: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const k of allowed) if (src && k in src) out[k] = src[k];
  return out;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ table: string }> }) {
  const user = await currentUser();
  if (!user) return fail("Not signed in", 401);

  const { table } = await ctx.params;
  if (!(table in TABLES)) return fail("Unknown table", 404);
  const spec = TABLES[table as TableName];

  const q = (await req.json().catch(() => null)) as Query | null;
  if (!q || !["select", "insert", "update", "delete"].includes(q.op)) return fail("Bad request", 400);

  // build the filter — always scoped to this user
  const where: Record<string, unknown> = { user_id: new Types.ObjectId(user.id) };
  for (const f of q.filters ?? []) {
    if (f.col === "user_id") continue; // ignored: ownership comes from the session
    if (!(spec.filterable as readonly string[]).includes(f.col)) return fail(`Can't filter on ${f.col}`, 400);
    const key = f.col === "id" ? "_id" : f.col;
    if (f.col === "id") {
      const ids = (f.op === "in" ? (f.value as unknown[]) : [f.value]).map(String);
      if (!ids.every((v) => Types.ObjectId.isValid(v))) return fail("Invalid id", 400);
      where._id = f.op === "in" ? { $in: ids.map((v) => new Types.ObjectId(v)) } : new Types.ObjectId(ids[0]);
    } else {
      where[key] = f.op === "in" ? { $in: f.value as unknown[] } : f.value;
    }
  }

  try {
    await connectDB();
    const M = spec.model;

    if (q.op === "select") {
      const count = q.count ? await M.countDocuments(where) : null;
      if (q.head) return NextResponse.json({ data: null, error: null, count });
      let cursor = M.find(where);
      if (q.order) {
        if (!(spec.sortable as readonly string[]).includes(q.order.col)) return fail(`Can't sort on ${q.order.col}`, 400);
        cursor = cursor.sort({ [q.order.col]: q.order.asc ? 1 : -1 });
      }
      const lim = q.single ? 1 : Math.min(Math.max(1, Number(q.limit) || 500), 500);
      const docs = (await cursor.limit(lim)).map((d) => d.toJSON());
      if (q.single) {
        return docs[0]
          ? NextResponse.json({ data: docs[0], error: null, count })
          : fail("Not found", 404);
      }
      return NextResponse.json({ data: docs, error: null, count });
    }

    if (q.op === "insert") {
      const doc = await M.create({ ...pick(q.payload, spec.writable), user_id: where.user_id });
      const json = doc.toJSON();
      return NextResponse.json({ data: q.single ? json : [json], error: null, count: null }, { status: 201 });
    }

    if (q.op === "update") {
      const set = pick(q.payload, spec.writable);
      if (!Object.keys(set).length) return fail("Nothing to update", 400);
      await M.updateMany(where, { $set: set }, { runValidators: true });
      const docs = (await M.find(where).limit(500)).map((d) => d.toJSON());
      return NextResponse.json({ data: q.single ? docs[0] ?? null : docs, error: null, count: null });
    }

    // delete
    await M.deleteMany(where);
    return NextResponse.json({ data: null, error: null, count: null });
  } catch (err) {
    const e = err as { name?: string; message?: string };
    if (e.name === "ValidationError" || e.name === "CastError") return fail(e.message ?? "Invalid data", 400);
    console.error(`[data/${table}]`, err);
    return fail("Database error", 500);
  }
}

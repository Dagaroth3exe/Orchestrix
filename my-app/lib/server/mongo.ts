import "server-only";
import mongoose from "mongoose";

/**
 * One shared MongoDB connection per server instance. Serverless functions and
 * dev hot-reloads reuse it via globalThis instead of opening a new pool each time.
 */
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as unknown as { __orchestrixMongo?: Cache };
const cache: Cache = (g.__orchestrixMongo ??= { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  cache.promise ??= mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || "orchestrix",
    bufferCommands: false,
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10,
  });
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}

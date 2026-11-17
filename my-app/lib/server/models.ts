import "server-only";
import { Schema, model, models, type Model } from "mongoose";

/**
 * Documents serialize to the same shape the UI already uses:
 * `id` (string), `user_id` (string) and snake_case fields with ISO dates.
 */
function toClient(_doc: unknown, ret: Record<string, unknown>) {
  ret.id = String(ret._id);
  if (ret.user_id) ret.user_id = String(ret.user_id);
  for (const k of Object.keys(ret)) {
    const v = ret[k];
    if (v instanceof Date) ret[k] = v.toISOString();
  }
  delete ret._id;
  delete ret.__v;
  delete ret.password_hash;
  return ret;
}
const opts = { toJSON: { transform: toClient }, versionKey: false } as const;

/* ───────── users ───────── */

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password_hash: { type: String, required: true },
    full_name: { type: String, default: "", trim: true, maxlength: 120 },
    created_at: { type: Date, default: Date.now },
  },
  opts
);

/* ───────── notes ───────── */

const NoteSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Untitled note", maxlength: 300 },
    preview: { type: String, default: "", maxlength: 500 },
    content: { type: String, default: "", maxlength: 200_000 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  opts
);
NoteSchema.index({ user_id: 1, updated_at: -1 });

/* ───────── tasks ───────── */

const TaskSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New task", maxlength: 300 },
    description: { type: String, default: "", maxlength: 20_000 },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    due_date: { type: String, default: null, match: /^\d{4}-\d{2}-\d{2}$/ },
    completed: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  opts
);
TaskSchema.index({ user_id: 1, created_at: -1 });

/* ───────── alerts ───────── */

const AlertSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, maxlength: 300 },
    message: { type: String, default: "", maxlength: 5_000 },
    type: { type: String, enum: ["info", "warning", "error", "success"], default: "info" },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  opts
);
AlertSchema.index({ user_id: 1, created_at: -1 });

/* reuse compiled models across hot reloads */
export const User: Model<unknown> = models.User ?? model("User", UserSchema);
export const Note: Model<unknown> = models.Note ?? model("Note", NoteSchema);
export const Task: Model<unknown> = models.Task ?? model("Task", TaskSchema);
export const Alert: Model<unknown> = models.Alert ?? model("Alert", AlertSchema);

/** Tables the client may query, and which fields it may filter, sort or write. */
export const TABLES = {
  notes: {
    model: Note,
    filterable: ["id", "title"],
    sortable: ["updated_at", "created_at", "title"],
    writable: ["title", "preview", "content", "updated_at"],
  },
  tasks: {
    model: Task,
    filterable: ["id", "completed", "priority", "due_date"],
    sortable: ["created_at", "due_date", "title"],
    writable: ["title", "description", "priority", "due_date", "completed"],
  },
  alerts: {
    model: Alert,
    filterable: ["id", "read", "type"],
    sortable: ["created_at", "timestamp"],
    writable: ["read"],
  },
} as const;
export type TableName = keyof typeof TABLES;

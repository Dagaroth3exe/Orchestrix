import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { demoClient } from "./demoClient";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Preview mode: when Supabase isn't configured (or NEXT_PUBLIC_DEMO_MODE=true)
 * the app runs against an in-browser mock backend with sample data, so the UI
 * can be explored without any setup.
 */
export const isPreview = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !URL || !ANON_KEY;

// Real client is created lazily so importing this module never needs env vars.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (isPreview) return demoClient as unknown as SupabaseClient;
  if (!client) client = createClient(URL!, ANON_KEY!);
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient();
    const value = Reflect.get(c, prop, c);
    return typeof value === "function" ? value.bind(c) : value;
  },
});

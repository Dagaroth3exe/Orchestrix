"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * proxy.ts gates app routes on an `auth=1` cookie. Supabase keeps its session
 * in localStorage, so mirror "is there a session?" into that cookie whenever
 * the auth state changes (initial load, sign in, sign out, token refresh).
 * This is only a navigation hint — data access is still enforced by Supabase.
 */
export default function AuthCookieSync() {
  useEffect(() => {
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        document.cookie = session
          ? "auth=1; path=/; max-age=2592000; SameSite=Lax"
          : "auth=; path=/; max-age=0; SameSite=Lax";
      });
      return () => data.subscription.unsubscribe();
    } catch {
      // Supabase not configured — nothing to sync
    }
  }, []);

  return null;
}

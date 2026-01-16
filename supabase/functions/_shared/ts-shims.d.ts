// TypeScript-only shims for Supabase Edge Functions when opened inside the main Vite TS project.
// Runtime is Deno (Supabase Edge Runtime), but tsserver in the web app repo doesn't understand:
// - `npm:` specifiers
// - `Deno` global
//
// This file is referenced via `/// <reference path="..." />` from individual function entrypoints.

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

declare module "npm:@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}


/**
 * Supabase database types.
 *
 * Placeholder for Phase 0. In Phase 1, after the migrations land, regenerate
 * this with:
 *   npx supabase gen types typescript --local > src/types/database.ts
 *
 * Until then, the generic `Database` shape keeps the typed clients compiling.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

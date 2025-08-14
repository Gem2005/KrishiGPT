import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Create a singleton instance of the Supabase client for Client Components
export const supabase = createClientComponentClient()

export function createClient() {
  return createClientComponentClient()
}

// Database types for TypeScript
export interface AgriculturalKnowledge {
  id: string
  title: string
  content: string
  category: string
  subcategory?: string
  language: string
  tags: string[]
  embedding?: number[]
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title?: string
  language: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: "user" | "assistant" | "system"
  content: string
  metadata?: any
  created_at: string
}

export interface SearchQuery {
  id: string
  user_id?: string
  query: string
  query_type: "text" | "voice" | "image"
  language: string
  results_count: number
  created_at: string
}

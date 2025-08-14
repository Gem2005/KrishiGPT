import { createClient } from "@supabase/supabase-js"

export interface CacheEntry {
  text: string
  embedding: number[]
  model: string
  created_at: string
}

export class EmbeddingCache {
  private supabaseClient
  private memoryCache: Map<string, CacheEntry> = new Map()
  private maxMemorySize = 1000 // Maximum entries in memory cache

  constructor() {
    this.supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }

  private generateCacheKey(text: string, model: string): string {
    // Create a hash-like key from text and model
    const combined = `${text}:${model}`
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  async get(text: string, model: string): Promise<number[] | null> {
    const cacheKey = this.generateCacheKey(text, model)

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey)
    if (memoryEntry) {
      console.log(`Cache hit (memory) for text: ${text.substring(0, 50)}...`)
      return memoryEntry.embedding
    }

    // Check database cache
    try {
      const { data, error } = await this.supabaseClient
        .from("embedding_cache")
        .select("embedding")
        .eq("cache_key", cacheKey)
        .eq("model", model)
        .single()

      if (error || !data) {
        return null
      }

      console.log(`Cache hit (database) for text: ${text.substring(0, 50)}...`)

      // Store in memory cache for faster future access
      const cacheEntry: CacheEntry = {
        text,
        embedding: data.embedding,
        model,
        created_at: new Date().toISOString(),
      }
      this.addToMemoryCache(cacheKey, cacheEntry)

      return data.embedding
    } catch (error) {
      console.error("Error reading from embedding cache:", error)
      return null
    }
  }

  async set(text: string, embedding: number[], model: string): Promise<void> {
    const cacheKey = this.generateCacheKey(text, model)

    const cacheEntry: CacheEntry = {
      text,
      embedding,
      model,
      created_at: new Date().toISOString(),
    }

    // Store in memory cache
    this.addToMemoryCache(cacheKey, cacheEntry)

    // Store in database cache
    try {
      const { error } = await this.supabaseClient.from("embedding_cache").upsert({
        cache_key: cacheKey,
        text: text.substring(0, 1000), // Limit text length for storage
        embedding,
        model,
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error storing in embedding cache:", error)
      } else {
        console.log(`Cached embedding for text: ${text.substring(0, 50)}...`)
      }
    } catch (error) {
      console.error("Error storing embedding in cache:", error)
    }
  }

  private addToMemoryCache(key: string, entry: CacheEntry): void {
    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value
      if (firstKey) {
        this.memoryCache.delete(firstKey)
      }
    }

    this.memoryCache.set(key, entry)
  }

  async batchGet(texts: string[], model: string): Promise<Map<string, number[]>> {
    const results = new Map<string, number[]>()

    for (const text of texts) {
      const embedding = await this.get(text, model)
      if (embedding) {
        results.set(text, embedding)
      }
    }

    return results
  }

  async batchSet(entries: Array<{ text: string; embedding: number[] }>, model: string): Promise<void> {
    const cacheEntries = entries.map((entry) => ({
      cache_key: this.generateCacheKey(entry.text, model),
      text: entry.text.substring(0, 1000),
      embedding: entry.embedding,
      model,
      created_at: new Date().toISOString(),
    }))

    try {
      const { error } = await this.supabaseClient.from("embedding_cache").upsert(cacheEntries)

      if (error) {
        console.error("Error batch storing in embedding cache:", error)
      } else {
        console.log(`Batch cached ${entries.length} embeddings`)
      }

      // Also store in memory cache
      entries.forEach((entry) => {
        const cacheKey = this.generateCacheKey(entry.text, model)
        this.addToMemoryCache(cacheKey, {
          text: entry.text,
          embedding: entry.embedding,
          model,
          created_at: new Date().toISOString(),
        })
      })
    } catch (error) {
      console.error("Error batch storing embeddings in cache:", error)
    }
  }

  async clearCache(model?: string): Promise<void> {
    try {
      let query = this.supabaseClient.from("embedding_cache").delete()

      if (model) {
        query = query.eq("model", model)
      } else {
        query = query.neq("id", "00000000-0000-0000-0000-000000000000") // Delete all
      }

      const { error } = await query

      if (error) {
        console.error("Error clearing embedding cache:", error)
      } else {
        console.log(`Cleared embedding cache${model ? ` for model ${model}` : ""}`)
      }

      // Clear memory cache
      if (model) {
        for (const [key, entry] of this.memoryCache.entries()) {
          if (entry.model === model) {
            this.memoryCache.delete(key)
          }
        }
      } else {
        this.memoryCache.clear()
      }
    } catch (error) {
      console.error("Error clearing cache:", error)
    }
  }

  getCacheStats(): { memorySize: number; maxMemorySize: number } {
    return {
      memorySize: this.memoryCache.size,
      maxMemorySize: this.maxMemorySize,
    }
  }
}

// Singleton instance
export const embeddingCache = new EmbeddingCache()

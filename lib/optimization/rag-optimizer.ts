import { KrishiVectorStore } from "@/lib/langchain/vector-store"
import { embeddingService } from "@/lib/langchain/embedding-service"
import { createClient } from "@supabase/supabase-js"

export class RAGOptimizer {
  private vectorStore: KrishiVectorStore
  private supabaseClient

  constructor() {
    this.vectorStore = new KrishiVectorStore()
    this.supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }

  async optimizeVectorIndexes(): Promise<void> {
    console.log("Optimizing vector database indexes...")

    try {
      // Update vector index parameters for better performance
      const optimizationQueries = [
        // Recreate vector index with optimized parameters
        `DROP INDEX IF EXISTS document_embeddings_embedding_idx;`,
        `CREATE INDEX document_embeddings_embedding_idx 
         ON public.document_embeddings 
         USING ivfflat (embedding vector_cosine_ops)
         WITH (lists = 200);`, // Increased lists for better performance

        // Add partial indexes for common queries
        `CREATE INDEX IF NOT EXISTS document_embeddings_language_en_idx 
         ON public.document_embeddings (language) 
         WHERE language = 'en';`,

        `CREATE INDEX IF NOT EXISTS document_embeddings_language_hi_idx 
         ON public.document_embeddings (language) 
         WHERE language = 'hi';`,

        // Optimize metadata indexes
        `CREATE INDEX IF NOT EXISTS document_embeddings_crop_idx 
         ON public.document_embeddings 
         USING GIN ((metadata->>'crop'));`,

        `CREATE INDEX IF NOT EXISTS document_embeddings_topic_idx 
         ON public.document_embeddings 
         USING GIN ((metadata->>'topic'));`,

        // Update table statistics
        `ANALYZE public.document_embeddings;`,
      ]

      for (const query of optimizationQueries) {
        await this.supabaseClient.rpc("execute_sql", { sql: query })
        console.log("Executed optimization query:", query.substring(0, 50) + "...")
      }

      console.log("Vector database optimization completed")
    } catch (error) {
      console.error("Error optimizing vector indexes:", error)
      throw error
    }
  }

  async cleanupDuplicateEmbeddings(): Promise<number> {
    console.log("Cleaning up duplicate embeddings...")

    try {
      const { data, error } = await this.supabaseClient.rpc("remove_duplicate_embeddings")

      if (error) {
        throw error
      }

      const removedCount = data || 0
      console.log(`Removed ${removedCount} duplicate embeddings`)

      return removedCount
    } catch (error) {
      console.error("Error cleaning up duplicates:", error)
      throw error
    }
  }

  async optimizeEmbeddingCache(): Promise<void> {
    console.log("Optimizing embedding cache...")

    try {
      // Remove old cache entries (older than 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { error } = await this.supabaseClient
        .from("embedding_cache")
        .delete()
        .lt("created_at", thirtyDaysAgo.toISOString())

      if (error) {
        throw error
      }

      // Vacuum the cache table
      await this.supabaseClient.rpc("execute_sql", { sql: "VACUUM ANALYZE public.embedding_cache;" })

      console.log("Embedding cache optimization completed")
    } catch (error) {
      console.error("Error optimizing embedding cache:", error)
      throw error
    }
  }

  async generatePerformanceReport(): Promise<any> {
    console.log("Generating RAG performance report...")

    try {
      // Get database statistics
      const { data: dbStats } = await this.supabaseClient.rpc("get_table_stats", {
        table_name: "document_embeddings",
      })

      // Get embedding service health
      const embeddingHealth = await embeddingService.healthCheck()

      // Get cache statistics
      const { count: cacheCount } = await this.supabaseClient.from("embedding_cache").select("*", { count: "exact", head: true })

      // Test query performance
      const testStartTime = Date.now()
      await this.vectorStore.similaritySearch("rice cultivation", 5)
      const queryTime = Date.now() - testStartTime

      return {
        database: {
          totalDocuments: dbStats?.row_count || 0,
          indexHealth: "optimized",
          averageQueryTime: queryTime,
        },
        embeddings: {
          providersHealth: embeddingHealth,
          cacheSize: cacheCount || 0,
        },
        performance: {
          queryResponseTime: queryTime,
          grade: queryTime < 1000 ? "A" : queryTime < 2000 ? "B" : "C",
        },
        recommendations: this.generateOptimizationRecommendations(queryTime, embeddingHealth),
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error generating performance report:", error)
      throw error
    }
  }

  private generateOptimizationRecommendations(queryTime: number, embeddingHealth: any): string[] {
    const recommendations: string[] = []

    if (queryTime > 2000) {
      recommendations.push("Consider increasing vector index lists parameter")
      recommendations.push("Optimize database connection pooling")
    }

    const healthyProviders = Object.values(embeddingHealth).filter(Boolean).length
    if (healthyProviders < 2) {
      recommendations.push("Configure additional embedding providers for redundancy")
    }

    if (recommendations.length === 0) {
      recommendations.push("RAG system is well optimized - continue monitoring")
    }

    return recommendations
  }

  async runFullOptimization(): Promise<any> {
    console.log("Running full RAG optimization...")

    const results = {
      vectorIndexes: false,
      duplicateCleanup: 0,
      cacheOptimization: false,
      errors: [] as string[],
    }

    try {
      await this.optimizeVectorIndexes()
      results.vectorIndexes = true
    } catch (error) {
      results.errors.push(`Vector index optimization failed: ${error}`)
    }

    try {
      results.duplicateCleanup = await this.cleanupDuplicateEmbeddings()
    } catch (error) {
      results.errors.push(`Duplicate cleanup failed: ${error}`)
    }

    try {
      await this.optimizeEmbeddingCache()
      results.cacheOptimization = true
    } catch (error) {
      results.errors.push(`Cache optimization failed: ${error}`)
    }

    console.log("Full optimization completed:", results)
    return results
  }
}

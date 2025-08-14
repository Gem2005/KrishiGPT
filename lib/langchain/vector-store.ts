import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import { OpenAIEmbeddings } from "@langchain/openai"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { createClient } from "@supabase/supabase-js"
import type { Document } from "@langchain/core/documents"

export class KrishiVectorStore {
  private vectorStore: SupabaseVectorStore
  private embeddings: OpenAIEmbeddings | GoogleGenerativeAIEmbeddings
  private supabaseClient

  constructor() {
    // Initialize Supabase client
    this.supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Initialize embeddings - prefer Google Gemini if available, fallback to OpenAI
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      this.embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        model: "text-embedding-004", // Latest Gemini embedding model
      })
    } else if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("abcd")) {
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "text-embedding-3-small",
        dimensions: 1536,
      })
    } else {
      throw new Error("No valid embedding API key found. Please set GOOGLE_GENERATIVE_AI_API_KEY or OPENAI_API_KEY")
    }

    // Initialize Supabase vector store
    this.vectorStore = new SupabaseVectorStore(this.embeddings, {
      client: this.supabaseClient,
      tableName: "document_embeddings",
      queryName: "match_documents",
    })
  }

  async addDocuments(documents: Document[]): Promise<void> {
    try {
      await this.vectorStore.addDocuments(documents)
      console.log(`Added ${documents.length} documents to vector store`)
    } catch (error) {
      console.error("Error adding documents to vector store:", error)
      throw error
    }
  }

  async similaritySearch(query: string, k = 5, filter?: Record<string, any>): Promise<Document[]> {
    try {
      const results = await this.vectorStore.similaritySearch(query, k, filter)
      console.log(`Found ${results.length} similar documents for query: ${query}`)
      return results
    } catch (error) {
      console.error("Error in similarity search:", error)
      throw error
    }
  }

  async similaritySearchWithScore(query: string, k = 5, filter?: Record<string, any>): Promise<[Document, number][]> {
    try {
      const results = await this.vectorStore.similaritySearchWithScore(query, k, filter)
      console.log(`Found ${results.length} documents with scores for query: ${query}`)
      return results
    } catch (error) {
      console.error("Error in similarity search with score:", error)
      throw error
    }
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      await this.vectorStore.delete({ ids })
      console.log(`Deleted ${ids.length} documents from vector store`)
    } catch (error) {
      console.error("Error deleting documents:", error)
      throw error
    }
  }

  // Get vector store instance for advanced operations
  getVectorStore(): SupabaseVectorStore {
    return this.vectorStore
  }
}

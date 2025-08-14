import { OpenAIEmbeddings } from "@langchain/openai"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers"

export interface EmbeddingOptions {
  model?: string
  dimensions?: number
  batchSize?: number
  timeout?: number
}

export interface EmbeddingResult {
  embeddings: number[][]
  model: string
  dimensions: number
  processingTime: number
}

export class EmbeddingService {
  private providers: Map<string, any> = new Map()
  private fallbackOrder = ["google", "openai", "huggingface"]

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders(): void {
    // Initialize OpenAI embeddings
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("abcd")) {
      try {
        this.providers.set(
          "openai",
          new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "text-embedding-3-small",
            dimensions: 1536,
            stripNewLines: true,
            timeout: 30000,
          }),
        )
        console.log("OpenAI embeddings initialized")
      } catch (error) {
        console.error("Failed to initialize OpenAI embeddings:", error)
      }
    }

    // Initialize Google embeddings
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        this.providers.set(
          "google",
          new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            modelName: "embedding-001",
            title: "Agricultural Knowledge Embedding",
          }),
        )
        console.log("Google embeddings initialized")
      } catch (error) {
        console.error("Failed to initialize Google embeddings:", error)
      }
    }

    // Initialize HuggingFace local embeddings as fallback
    try {
      this.providers.set(
        "huggingface",
        new HuggingFaceTransformersEmbeddings({
          modelName: "sentence-transformers/all-MiniLM-L6-v2",
          timeout: 60000,
        }),
      )
      console.log("HuggingFace embeddings initialized")
    } catch (error) {
      console.error("Failed to initialize HuggingFace embeddings:", error)
    }
  }

  async embedDocuments(texts: string[], options: EmbeddingOptions = {}): Promise<EmbeddingResult> {
    const startTime = Date.now()

    for (const providerName of this.fallbackOrder) {
      const provider = this.providers.get(providerName)
      if (!provider) continue

      try {
        console.log(`Attempting to embed ${texts.length} documents using ${providerName}`)

        // Preprocess texts for better agricultural context
        const processedTexts = texts.map((text) => this.preprocessText(text))

        // Handle batch processing
        const batchSize = options.batchSize || 100
        const allEmbeddings: number[][] = []

        for (let i = 0; i < processedTexts.length; i += batchSize) {
          const batch = processedTexts.slice(i, i + batchSize)
          const batchEmbeddings = await provider.embedDocuments(batch)
          allEmbeddings.push(...batchEmbeddings)

          // Add small delay between batches to avoid rate limiting
          if (i + batchSize < processedTexts.length) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }

        const processingTime = Date.now() - startTime

        console.log(`Successfully embedded ${texts.length} documents using ${providerName} in ${processingTime}ms`)

        return {
          embeddings: allEmbeddings,
          model: providerName,
          dimensions: allEmbeddings[0]?.length || 0,
          processingTime,
        }
      } catch (error) {
        console.error(`Error with ${providerName} embeddings:`, error)
        continue
      }
    }

    throw new Error("All embedding providers failed")
  }

  async embedQuery(text: string, options: EmbeddingOptions = {}): Promise<EmbeddingResult> {
    const startTime = Date.now()

    for (const providerName of this.fallbackOrder) {
      const provider = this.providers.get(providerName)
      if (!provider) continue

      try {
        console.log(`Attempting to embed query using ${providerName}`)

        // Preprocess query for better agricultural context
        const processedText = this.preprocessQuery(text)

        const embedding = await provider.embedQuery(processedText)
        const processingTime = Date.now() - startTime

        console.log(`Successfully embedded query using ${providerName} in ${processingTime}ms`)

        return {
          embeddings: [embedding],
          model: providerName,
          dimensions: embedding.length,
          processingTime,
        }
      } catch (error) {
        console.error(`Error with ${providerName} query embedding:`, error)
        continue
      }
    }

    throw new Error("All embedding providers failed for query")
  }

  private preprocessText(text: string): string {
    // Clean and normalize text for better embeddings
    let processed = text
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[^\w\s\u0900-\u097F\u0C00-\u0C7F.,!?()-]/g, "") // Keep alphanumeric, Hindi, Telugu, and basic punctuation

    // Add agricultural context markers for better semantic understanding
    const agriculturalTerms = this.extractAgriculturalTerms(processed)
    if (agriculturalTerms.length > 0) {
      processed = `Agricultural context: ${agriculturalTerms.join(", ")}. ${processed}`
    }

    return processed
  }

  private preprocessQuery(query: string): string {
    // Enhance query with agricultural context
    let processed = query.trim().replace(/\s+/g, " ")

    // Add context based on query type
    const queryLower = processed.toLowerCase()

    if (queryLower.includes("grow") || queryLower.includes("cultivation")) {
      processed = `Crop cultivation query: ${processed}`
    } else if (queryLower.includes("pest") || queryLower.includes("disease")) {
      processed = `Pest and disease management query: ${processed}`
    } else if (queryLower.includes("soil") || queryLower.includes("fertilizer")) {
      processed = `Soil and nutrient management query: ${processed}`
    } else if (queryLower.includes("weather") || queryLower.includes("rain")) {
      processed = `Weather and climate query: ${processed}`
    } else {
      processed = `Agricultural farming query: ${processed}`
    }

    return processed
  }

  private extractAgriculturalTerms(text: string): string[] {
    const textLower = text.toLowerCase()
    const terms: string[] = []

    // Crop terms
    const crops = [
      "rice",
      "wheat",
      "maize",
      "cotton",
      "sugarcane",
      "groundnut",
      "soybean",
      "bajra",
      "jowar",
      "mustard",
      "chickpea",
      "tomato",
      "potato",
      "onion",
    ]
    crops.forEach((crop) => {
      if (textLower.includes(crop)) terms.push(crop)
    })

    // Practice terms
    const practices = [
      "irrigation",
      "fertilizer",
      "pesticide",
      "harvesting",
      "planting",
      "sowing",
      "cultivation",
      "organic",
      "pest control",
    ]
    practices.forEach((practice) => {
      if (textLower.includes(practice)) terms.push(practice)
    })

    // Season terms
    const seasons = ["kharif", "rabi", "zaid", "monsoon", "winter", "summer"]
    seasons.forEach((season) => {
      if (textLower.includes(season)) terms.push(season)
    })

    return [...new Set(terms)] // Remove duplicates
  }

  async getEmbeddingDimensions(provider?: string): Promise<number> {
    const providerName = provider || this.fallbackOrder[0]
    const embeddingProvider = this.providers.get(providerName)

    if (!embeddingProvider) {
      throw new Error(`Provider ${providerName} not available`)
    }

    try {
      // Test with a simple query to get dimensions
      const testEmbedding = await embeddingProvider.embedQuery("test")
      return testEmbedding.length
    } catch (error) {
      console.error(`Error getting dimensions for ${providerName}:`, error)
      return 1536 // Default OpenAI dimensions
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}

    for (const [providerName, provider] of this.providers) {
      try {
        await provider.embedQuery("health check")
        health[providerName] = true
        console.log(`${providerName} embedding provider is healthy`)
      } catch (error) {
        health[providerName] = false
        console.error(`${providerName} embedding provider failed health check:`, error)
      }
    }

    return health
  }

  // Batch processing with progress tracking
  async embedDocumentsBatch(
    texts: string[],
    options: EmbeddingOptions & { onProgress?: (progress: number) => void } = {},
  ): Promise<EmbeddingResult> {
    const batchSize = options.batchSize || 50
    const totalBatches = Math.ceil(texts.length / batchSize)
    let processedBatches = 0

    const startTime = Date.now()
    const allEmbeddings: number[][] = []
    let usedProvider = ""

    for (const providerName of this.fallbackOrder) {
      const provider = this.providers.get(providerName)
      if (!provider) continue

      try {
        console.log(`Processing ${texts.length} documents in ${totalBatches} batches using ${providerName}`)

        for (let i = 0; i < texts.length; i += batchSize) {
          const batch = texts.slice(i, i + batchSize)
          const processedBatch = batch.map((text) => this.preprocessText(text))

          const batchEmbeddings = await provider.embedDocuments(processedBatch)
          allEmbeddings.push(...batchEmbeddings)

          processedBatches++
          const progress = (processedBatches / totalBatches) * 100

          if (options.onProgress) {
            options.onProgress(progress)
          }

          console.log(`Processed batch ${processedBatches}/${totalBatches} (${progress.toFixed(1)}%)`)

          // Rate limiting delay
          if (i + batchSize < texts.length) {
            await new Promise((resolve) => setTimeout(resolve, 200))
          }
        }

        usedProvider = providerName
        break
      } catch (error) {
        console.error(`Batch processing failed with ${providerName}:`, error)
        allEmbeddings.length = 0 // Reset on failure
        processedBatches = 0
        continue
      }
    }

    if (allEmbeddings.length === 0) {
      throw new Error("All embedding providers failed for batch processing")
    }

    const processingTime = Date.now() - startTime

    console.log(
      `Batch embedding completed: ${texts.length} documents processed in ${processingTime}ms using ${usedProvider}`,
    )

    return {
      embeddings: allEmbeddings,
      model: usedProvider,
      dimensions: allEmbeddings[0]?.length || 0,
      processingTime,
    }
  }
}

// Singleton instance for global use
export const embeddingService = new EmbeddingService()

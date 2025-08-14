import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { Document } from "@langchain/core/documents"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { TextLoader } from "langchain/document_loaders/fs/text"
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv"
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx"
import { KrishiVectorStore } from "./vector-store"

export interface ProcessingOptions {
  chunkSize?: number
  chunkOverlap?: number
  language?: string
  documentType?: string
  metadata?: Record<string, any>
}

export class DocumentProcessor {
  private vectorStore: KrishiVectorStore
  private textSplitter: RecursiveCharacterTextSplitter

  constructor() {
    this.vectorStore = new KrishiVectorStore()
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    })
  }

  async processFile(filePath: string, options: ProcessingOptions = {}): Promise<Document[]> {
    try {
      const documents = await this.loadDocument(filePath)
      return await this.processDocuments(documents, options)
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error)
      throw error
    }
  }

  async processText(text: string, options: ProcessingOptions = {}): Promise<Document[]> {
    try {
      const document = new Document({
        pageContent: text,
        metadata: {
          source: "text_input",
          ...options.metadata,
        },
      })

      return await this.processDocuments([document], options)
    } catch (error) {
      console.error("Error processing text:", error)
      throw error
    }
  }

  async processBulkDocuments(documents: Document[], options: ProcessingOptions = {}): Promise<Document[]> {
    try {
      return await this.processDocuments(documents, options)
    } catch (error) {
      console.error("Error processing bulk documents:", error)
      throw error
    }
  }

  private async loadDocument(filePath: string): Promise<Document[]> {
    const extension = filePath.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "pdf":
        const pdfLoader = new PDFLoader(filePath)
        return await pdfLoader.load()

      case "txt":
        const textLoader = new TextLoader(filePath)
        return await textLoader.load()

      case "csv":
        const csvLoader = new CSVLoader(filePath)
        return await csvLoader.load()

      case "docx":
        const docxLoader = new DocxLoader(filePath)
        return await docxLoader.load()

      default:
        throw new Error(`Unsupported file type: ${extension}`)
    }
  }

  private async processDocuments(documents: Document[], options: ProcessingOptions = {}): Promise<Document[]> {
    // Configure text splitter based on options
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: options.chunkSize || 1000,
      chunkOverlap: options.chunkOverlap || 200,
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    })

    // Split documents into chunks
    const chunks = await splitter.splitDocuments(documents)

    // Enhance metadata for each chunk
    const processedChunks = chunks.map((chunk, index) => {
      const enhancedMetadata = {
        ...chunk.metadata,
        document_type: options.documentType || "agricultural_knowledge",
        language: options.language || this.detectLanguage(chunk.pageContent),
        chunk_index: index,
        processed_at: new Date().toISOString(),
        ...options.metadata,
      }

      // Add agricultural-specific metadata
      const agriculturalMetadata = this.extractAgriculturalMetadata(chunk.pageContent)

      return new Document({
        pageContent: chunk.pageContent,
        metadata: {
          ...enhancedMetadata,
          ...agriculturalMetadata,
        },
      })
    })

    console.log(`Processed ${processedChunks.length} document chunks`)
    return processedChunks
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on character patterns
    const hindiPattern = /[\u0900-\u097F]/
    const teluguPattern = /[\u0C00-\u0C7F]/

    if (hindiPattern.test(text)) return "hi"
    if (teluguPattern.test(text)) return "te"
    return "en"
  }

  private extractAgriculturalMetadata(content: string): Record<string, any> {
    const metadata: Record<string, any> = {}
    const contentLower = content.toLowerCase()

    // Extract crop information
    const crops = [
      "rice",
      "wheat",
      "maize",
      "bajra",
      "jowar",
      "cotton",
      "sugarcane",
      "groundnut",
      "soybean",
      "mustard",
      "chickpea",
      "pigeon pea",
      "tomato",
      "potato",
      "onion",
      "garlic",
      "chili",
      "turmeric",
      "ginger",
    ]

    const foundCrops = crops.filter((crop) => contentLower.includes(crop))
    if (foundCrops.length > 0) {
      metadata.crops = foundCrops
      metadata.crop = foundCrops[0] // Primary crop
    }

    // Extract season information
    const seasons = ["kharif", "rabi", "zaid", "monsoon", "winter", "summer"]
    const foundSeasons = seasons.filter((season) => contentLower.includes(season))
    if (foundSeasons.length > 0) {
      metadata.seasons = foundSeasons
      metadata.season = foundSeasons[0]
    }

    // Extract topic categories
    const topics = {
      cultivation: ["cultivation", "planting", "sowing", "growing", "farming"],
      pest_management: ["pest", "disease", "insect", "fungus", "pesticide", "spray"],
      soil_health: ["soil", "fertilizer", "nutrient", "compost", "manure"],
      irrigation: ["irrigation", "water", "watering", "drip", "sprinkler"],
      harvesting: ["harvest", "harvesting", "yield", "production"],
      weather: ["weather", "rain", "drought", "temperature", "climate"],
      organic: ["organic", "natural", "bio", "sustainable"],
    }

    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some((keyword) => contentLower.includes(keyword))) {
        metadata.topic = topic
        break
      }
    }

    // Extract regional information
    const regions = [
      "punjab",
      "haryana",
      "uttar pradesh",
      "bihar",
      "west bengal",
      "maharashtra",
      "gujarat",
      "rajasthan",
      "madhya pradesh",
      "karnataka",
      "andhra pradesh",
      "telangana",
      "tamil nadu",
      "kerala",
      "odisha",
    ]

    const foundRegions = regions.filter((region) => contentLower.includes(region))
    if (foundRegions.length > 0) {
      metadata.regions = foundRegions
      metadata.region = foundRegions[0]
    }

    return metadata
  }

  async addToVectorStore(documents: Document[]): Promise<void> {
    try {
      await this.vectorStore.addDocuments(documents)
      console.log(`Added ${documents.length} processed documents to vector store`)
    } catch (error) {
      console.error("Error adding documents to vector store:", error)
      throw error
    }
  }

  async processAndStore(
    input: string | Document[],
    options: ProcessingOptions = {},
  ): Promise<{ processed: number; stored: number }> {
    try {
      let processedDocs: Document[]

      if (typeof input === "string") {
        // Process as text
        processedDocs = await this.processText(input, options)
      } else {
        // Process as document array
        processedDocs = await this.processBulkDocuments(input, options)
      }

      // Store in vector database
      await this.addToVectorStore(processedDocs)

      return {
        processed: processedDocs.length,
        stored: processedDocs.length,
      }
    } catch (error) {
      console.error("Error in processAndStore:", error)
      throw error
    }
  }

  // Batch processing for large datasets
  async processBatch(
    inputs: Array<{ content: string; metadata?: Record<string, any> }>,
    options: ProcessingOptions = {},
  ): Promise<{ processed: number; stored: number; errors: number }> {
    let processed = 0
    let stored = 0
    let errors = 0

    for (const input of inputs) {
      try {
        const result = await this.processAndStore(input.content, {
          ...options,
          metadata: { ...options.metadata, ...input.metadata },
        })

        processed += result.processed
        stored += result.stored
      } catch (error) {
        console.error("Error processing batch item:", error)
        errors++
      }
    }

    console.log(`Batch processing complete: ${processed} processed, ${stored} stored, ${errors} errors`)

    return { processed, stored, errors }
  }
}

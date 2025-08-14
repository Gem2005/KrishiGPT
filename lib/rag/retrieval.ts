import { createClient } from "@/lib/supabase/server"
import { EmbeddingService } from "./embeddings"

export interface RetrievalResult {
  content: string
  title: string
  category: string
  language: string
  similarity: number
}

export class RetrievalService {
  private embeddingService: EmbeddingService
  private fallbackKnowledge = [
    {
      title: "Rice Cultivation in Monsoon",
      content:
        "Rice thrives in monsoon conditions with proper water management. For rainy weather: 1) Ensure proper drainage to prevent waterlogging 2) Use flood-tolerant varieties like Swarna-Sub1 or IR64-Sub1 3) Apply nitrogen fertilizer in split doses 4) Monitor for blast and bacterial blight diseases 5) Maintain 2-5cm water level in fields 6) Plant during optimal monsoon timing (June-July)",
      category: "crop_management",
      language: "en",
    },
    {
      title: "Wheat Winter Cultivation",
      content:
        "Winter wheat requires cool, moist conditions. Best practices: 1) Sow between November-December 2) Use varieties like HD-2967, PBW-343 3) Apply 120kg N, 60kg P2O5, 40kg K2O per hectare 4) Irrigate at crown root initiation, tillering, flowering stages 5) Control weeds with 2,4-D or metsulfuron 6) Harvest when moisture content is 20-25%",
      category: "crop_management",
      language: "en",
    },
    {
      title: "Tomato Disease Management",
      content:
        "Common tomato diseases and solutions: 1) Early blight - spray mancozeb 0.25% 2) Late blight - use metalaxyl + mancozeb 3) Bacterial wilt - soil solarization, resistant varieties 4) Fusarium wilt - crop rotation, bio-agents 5) Leaf curl virus - control whiteflies with imidacloprid 6) Maintain proper spacing and ventilation",
      category: "pest_disease",
      language: "en",
    },
    {
      title: "Monsoon Crop Selection",
      content:
        "Best crops for monsoon season: 1) Rice - main kharif crop, flood tolerant 2) Cotton - requires well-drained soil 3) Sugarcane - plant before monsoon 4) Maize - good drainage essential 5) Pulses - arhar, moong, urad 6) Vegetables - okra, brinjal, chili 7) Consider local rainfall patterns and soil type",
      category: "crop_selection",
      language: "en",
    },
    {
      title: "Soil Health Management",
      content:
        "Maintaining soil health: 1) Test soil pH (6.0-7.5 optimal) 2) Add organic matter - compost, FYM 3) Practice crop rotation 4) Use cover crops 5) Minimize tillage 6) Apply lime for acidic soils 7) Use bio-fertilizers - Rhizobium, PSB, Azotobacter 8) Maintain proper drainage",
      category: "soil_management",
      language: "en",
    },
    {
      title: "बारिश में धान की खेती",
      content:
        "बारिश के मौसम में धान की खेती: 1) उचित जल निकासी सुनिश्चित करें 2) बाढ़ सहनशील किस्में जैसे स्वर्णा-सब1 का उपयोग करें 3) नाइट्रोजन खाद को भागों में दें 4) ब्लास्ट और बैक्टीरियल ब्लाइट रोग से बचाव करें 5) खेत में 2-5 सेमी पानी बनाए रखें 6) जून-जुलाई में बुआई करें",
      category: "crop_management",
      language: "hi",
    },
    {
      title: "వర్షాకాలంలో వరి సాగు",
      content:
        "వర్షాకాలంలో వరి సాగు చేయడానికి: 1) సరైన నీటి నిర్వహణ చేయండి 2) వరద నిరోధక రకాలు ఉపయోగించండి 3) నత్రజని ఎరువులను విభజించి వేయండి 4) వ్యాధుల నుండి కాపాడండి 5) పొలంలో 2-5 సెంటీమీటర్ల నీరు ఉంచండి 6) జూన్-జూలైలో విత్తనాలు వేయండి",
      category: "crop_management",
      language: "te",
    },
  ]

  constructor() {
    this.embeddingService = EmbeddingService.getInstance()
  }

  async retrieveRelevantKnowledge(query: string, language = "en", limit = 5): Promise<RetrievalResult[]> {
    try {
      const supabase = await createClient()

      // Try to retrieve from database first
      const { data: knowledgeItems, error } = await supabase
        .from("agricultural_knowledge")
        .select("*")
        .eq("language", language)
        .limit(50)

      let dataToProcess = knowledgeItems

      if (error || !knowledgeItems || knowledgeItems.length === 0) {
        console.log("Using fallback agricultural knowledge")
        dataToProcess = this.fallbackKnowledge.filter((item) => item.language === language)
      }

      if (!dataToProcess || dataToProcess.length === 0) {
        return []
      }

      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query)

      // Calculate similarities and rank results
      const results: RetrievalResult[] = []

      for (const item of dataToProcess) {
        const contentEmbedding = item.embedding || (await this.embeddingService.generateEmbedding(item.content))

        const similarity = this.embeddingService.cosineSimilarity(queryEmbedding, contentEmbedding)

        if (similarity > 0.1) {
          results.push({
            content: item.content,
            title: item.title,
            category: item.category,
            language: item.language,
            similarity,
          })
        }
      }

      // Sort by similarity and return top results
      return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
    } catch (error) {
      console.error("Error in knowledge retrieval:", error)
      return this.getFallbackResults(query, language, limit)
    }
  }

  private async getFallbackResults(query: string, language = "en", limit = 5): Promise<RetrievalResult[]> {
    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(query)
      const relevantData = this.fallbackKnowledge.filter((item) => item.language === language)

      const results: RetrievalResult[] = []

      for (const item of relevantData) {
        const contentEmbedding = await this.embeddingService.generateEmbedding(item.content)
        const similarity = this.embeddingService.cosineSimilarity(queryEmbedding, contentEmbedding)

        if (similarity > 0.1) {
          results.push({
            content: item.content,
            title: item.title,
            category: item.category,
            language: item.language,
            similarity,
          })
        }
      }

      return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
    } catch (error) {
      console.error("Error in fallback retrieval:", error)
      return []
    }
  }

  async searchByCategory(category: string, language = "en", limit = 10): Promise<RetrievalResult[]> {
    try {
      const supabase = await createClient()

      const { data: knowledgeItems, error } = await (supabase
          .from("agricultural_knowledge")
          .select("*") as any)
          .eq("category", category)
          .eq("language", language)
          .limit(limit)

      if (error || !knowledgeItems || knowledgeItems.length === 0) {
        const fallbackResults = this.fallbackKnowledge
          .filter((item) => item.category === category && item.language === language)
          .slice(0, limit)
          .map((item) => ({
            content: item.content,
            title: item.title,
            category: item.category,
            language: item.language,
            similarity: 1.0,
          }))

        return fallbackResults
      }

      return knowledgeItems.map((item: {
        content: string;
        title: string;
        category: string;
        language: string;
        embedding?: any;
      }) => ({
        content: item.content,
        title: item.title,
        category: item.category,
        language: item.language,
        similarity: 1.0,
      }))
    } catch (error) {
      console.error("Error in category search:", error)
      return []
    }
  }
}

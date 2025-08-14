import { ChatOpenAI } from "@langchain/openai"
import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables"
import { StringOutputParser } from "@langchain/core/output_parsers"
import type { Document } from "@langchain/core/documents"
import { KrishiVectorStore } from "./vector-store"
import { WeatherService } from "../weather/service"

export interface RAGOptions {
  userLocation?: string
  language?: string
  conversationHistory?: string[]
  weatherData?: any
}

export class KrishiRAGChain {
  private vectorStore: KrishiVectorStore
  private weatherService: WeatherService
  private models: {
    groq?: ChatGroq
    openai?: ChatOpenAI
    gemini?: ChatGoogleGenerativeAI
  }

  constructor() {
    this.vectorStore = new KrishiVectorStore()
    this.weatherService = new WeatherService()
    this.models = this.initializeModels()
  }

  private initializeModels() {
    const models: any = {}

    try {
      // Initialize Groq
      if (process.env.GROQ_API_KEY) {
        models.groq = new ChatGroq({
          apiKey: process.env.GROQ_API_KEY,
          model: "llama-3.1-8b-instant",
          temperature: 0.1,
          maxTokens: 1000,
        })
      }

      // Initialize OpenAI
      if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("abcd")) {
        models.openai = new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: "gpt-4o-mini",
          temperature: 0.1,
          maxTokens: 1000,
        })
      }

      // Initialize Gemini with error handling
      if (process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GOOGLE_GENERATIVE_AI_API_KEY.trim()) {
        try {
          models.gemini = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            model: "gemini-1.5-flash",
            temperature: 0.1,
            maxOutputTokens: 1000,
          })
        } catch (geminiError) {
          console.warn("Failed to initialize Gemini model:", geminiError)
        }
      }
    } catch (error) {
      console.error("Error initializing models:", error)
    }

    return models
  }

  private createPromptTemplate(language = "en"): PromptTemplate {
    const templates = {
      en: `You are KrishiGPT, an expert agricultural AI assistant helping farmers in India. 
Use the provided context to answer the farmer's question accurately and practically.

Context from agricultural knowledge base:
{context}

Weather Information:
{weather}

Conversation History:
{history}

Farmer's Question: {question}

Instructions:
- Provide practical, actionable advice
- Keep responses concise (2-3 sentences max)
- Use simple language farmers can understand
- Include specific timing, quantities, or methods when relevant
- If location-specific, tailor advice to that region
- If you don't know something, say so honestly

Answer:`,

      hi: `आप KrishiGPT हैं, भारत के किसानों की मदद करने वाले एक विशेषज्ञ कृषि AI सहायक हैं।
किसान के प्रश्न का सटीक और व्यावहारिक उत्तर देने के लिए दिए गए संदर्भ का उपयोग करें।

कृषि ज्ञान आधार से संदर्भ:
{context}

मौसम की जानकारी:
{weather}

बातचीत का इतिहास:
{history}

किसान का प्रश्न: {question}

निर्देश:
- व्यावहारिक, कार्यान्वित करने योग्य सलाह दें
- उत्तर संक्षिप्त रखें (अधिकतम 2-3 वाक्य)
- सरल भाषा का उपयोग करें जिसे किसान समझ सकें
- प्रासंगिक होने पर विशिष्ट समय, मात्रा या तरीके शामिल करें

उत्तर:`,

      te: `మీరు KrishiGPT, భారతదేశంలోని రైతులకు సహాయం చేసే నిపుణ వ్యవసాయ AI సహాయకుడు.
రైతు ప్రశ్నకు ఖచ్చితంగా మరియు ఆచరణాత్మకంగా సమాధానం ఇవ్వడానికి అందించిన సందర్భాన్ని ఉపయోగించండి।

వ్యవసాయ జ్ఞాన స్థావరం నుండి సందర్భం:
{context}

వాతావరణ సమాచారం:
{weather}

సంభాషణ చరిత్ర:
{history}

రైతు ప్రశ్న: {question}

సూచనలు:
- ఆచరణాత్మక, అమలు చేయగల సలహా ఇవ్వండి
- సమాధానాలను సంక్షిప్తంగా ఉంచండి (గరిష్టంగా 2-3 వాక్యాలు)
- రైతులు అర్థం చేసుకోగల సరళమైన భాష ఉపయోగించండి

సమాధానం:`,
    }

    return PromptTemplate.fromTemplate(templates[language as keyof typeof templates] || templates.en)
  }

  private async retrieveContext(query: string, options: RAGOptions): Promise<string> {
    try {
      // Create filter based on options
      const filter: Record<string, any> = {}

      if (options.language) {
        filter.language = options.language
      }

      if (options.userLocation) {
        // Extract region from location for filtering
        const locationLower = options.userLocation.toLowerCase()
        if (locationLower.includes("rajasthan")) {
          filter.region = "rajasthan"
        }
      }

      // Perform similarity search
      const relevantDocs = await this.vectorStore.similaritySearchWithScore(
        query,
        5,
        Object.keys(filter).length > 0 ? filter : undefined,
      )

      // Format context from retrieved documents
      const context = relevantDocs
        .filter(([_, score]) => score > 0.7) // Filter by relevance threshold
        .map(([doc, score]) => `${doc.pageContent} (Relevance: ${score.toFixed(2)})`)
        .join("\n\n")

      return context || "No specific agricultural knowledge found for this query."
    } catch (error) {
      console.error("Error retrieving context:", error)
      return "Agricultural knowledge retrieval temporarily unavailable."
    }
  }

  private async getWeatherContext(location?: string): Promise<string> {
    if (!location) return ""

    try {
      const weather = await this.weatherService.getWeatherData(location)
      if (!weather) return ""
      return `Current weather in ${location}: ${weather.forecast}, Temperature: ${weather.temperature}°C, Humidity: ${weather.humidity}%`
    } catch (error) {
      console.error("Error fetching weather:", error)
      return ""
    }
  }

  private formatConversationHistory(history?: string[]): string {
    if (!history || history.length === 0) return "No previous conversation."

    return history
      .slice(-4) // Keep last 4 messages for context
      .map((msg, index) => `${index % 2 === 0 ? "Farmer" : "KrishiGPT"}: ${msg}`)
      .join("\n")
  }

  async generateResponse(query: string, options: RAGOptions = {}): Promise<string> {
    try {
      // Get available model (try in order: groq, openai, gemini)
      const model = this.models.groq || this.models.openai || this.models.gemini

      if (!model) {
        throw new Error("No AI models available")
      }

      // Create the RAG chain
      const prompt = this.createPromptTemplate(options.language || "en")

      const chain = RunnableSequence.from([
        {
          context: async (input: { question: string }) => await this.retrieveContext(input.question, options),
          weather: async () => await this.getWeatherContext(options.userLocation),
          history: () => this.formatConversationHistory(options.conversationHistory),
          question: new RunnablePassthrough(),
        },
        prompt,
        model,
        new StringOutputParser(),
      ])

      // Generate response
      const response = await chain.invoke({ question: query })

      console.log(`Generated response using LangChain RAG for query: ${query}`)
      return response.trim()
    } catch (error) {
      console.error("Error in RAG chain:", error)

      // Fallback to basic response
      return this.getFallbackResponse(query, options)
    }
  }

  private getFallbackResponse(query: string, options: RAGOptions): string {
    const language = options.language || "en"

    const fallbacks = {
      en: "I'm having trouble accessing my knowledge base right now. For immediate agricultural advice, please consult your local agricultural extension officer or visit the nearest Krishi Vigyan Kendra.",
      hi: "मुझे अभी अपने ज्ञान आधार तक पहुंचने में समस्या हो रही है। तत्काल कृषि सलाह के लिए, कृपया अपने स्थानीय कृषि विस्तार अधिकारी से संपर्क करें या निकटतम कृषि विज्ञान केंद्र पर जाएं।",
      te: "నేను ప్రస్తుతం నా జ్ఞాన స్థావరాన్ని యాక్సెస్ చేయడంలో ఇబ్బంది పడుతున్నాను. తక్షణ వ్యవసాయ సలహా కోసం, దయచేసి మీ స్థానిక వ్యవసాయ విస్తరణ అధికారిని సంప్రదించండి లేదా సమీప కృషి విజ్ఞాన కేంద్రాన్ని సందర్శించండి.",
    }

    return fallbacks[language as keyof typeof fallbacks] || fallbacks.en
  }

  // Method to add new agricultural documents
  async addKnowledge(documents: Document[]): Promise<void> {
    await this.vectorStore.addDocuments(documents)
  }

  // Method to search knowledge base directly
  async searchKnowledge(query: string, options: RAGOptions = {}): Promise<Document[]> {
    const filter: Record<string, any> = {}

    if (options.language) {
      filter.language = options.language
    }

    return await this.vectorStore.similaritySearch(query, 5, Object.keys(filter).length > 0 ? filter : undefined)
  }
}

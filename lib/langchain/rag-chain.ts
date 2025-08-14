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
You have access to comprehensive agricultural knowledge and real-time weather data.

AGRICULTURAL KNOWLEDGE BASE:
{context}

REAL-TIME WEATHER & AGRICULTURAL CONDITIONS:
{weather}

CONVERSATION HISTORY:
{history}

FARMER'S QUESTION: {question}

INSTRUCTIONS FOR COMPREHENSIVE RESPONSE:
1. ANALYZE the current weather conditions and their impact on farming
2. CORRELATE weather data with agricultural best practices from knowledge base
3. PROVIDE specific, actionable advice tailored to the location and current conditions
4. INCLUDE timing recommendations based on weather patterns
5. SUGGEST preventive measures for weather-related risks
6. RECOMMEND optimal farming activities for current conditions

RESPONSE GUIDELINES:
- Start with immediate weather-based recommendations
- Include specific quantities, timings, or methods when relevant
- Address location-specific concerns and opportunities
- Keep language simple and practical for farmers
- Prioritize actionable advice over theoretical knowledge
- If weather poses risks, emphasize protective measures
- If conditions are favorable, suggest optimal activities

RESPONSE FORMAT:
🌤️ CURRENT CONDITIONS: [Brief weather summary]
🌾 IMMEDIATE RECOMMENDATIONS: [Urgent actions based on weather]
📋 DETAILED ADVICE: [Comprehensive farming guidance]
⚠️ PRECAUTIONS: [Weather-related risks and prevention]
📅 TIMING: [Best times for suggested activities]

Answer:`,

      hi: `आप KrishiGPT हैं, भारत के किसानों की मदद करने वाले एक विशेषज्ञ कृषि AI सहायक हैं।
आपके पास व्यापक कृषि ज्ञान और वास्तविक समय का मौसम डेटा उपलब्ध है।

कृषि ज्ञान आधार:
{context}

वास्तविक समय मौसम और कृषि स्थितियां:
{weather}

बातचीत का इतिहास:
{history}

किसान का प्रश्न: {question}

व्यापक उत्तर के लिए निर्देश:
1. वर्तमान मौसम स्थितियों और खेती पर उनके प्रभाव का विश्लेषण करें
2. मौसम डेटा को ज्ञान आधार से कृषि सर्वोत्तम प्रथाओं के साथ जोड़ें
3. स्थान और वर्तमान स्थितियों के अनुकूल विशिष्ट, कार्यान्वित करने योग्य सलाह प्रदान करें
4. मौसम पैटर्न के आधार पर समय की सिफारिशें शामिल करें
5. मौसम संबंधी जोखिमों के लिए निवारक उपाय सुझाएं

उत्तर प्रारूप:
🌤️ वर्तमान स्थितियां: [संक्षिप्त मौसम सारांश]
🌾 तत्काल सिफारिशें: [मौसम के आधार पर तुरंत करने योग्य कार्य]
📋 विस्तृत सलाह: [व्यापक कृषि मार्गदर्शन]
⚠️ सावधानियां: [मौसम संबंधी जोखिम और रोकथाम]

उत्तर:`,

      te: `మీరు KrishiGPT, భారతదేశంలోని రైతులకు సహాయం చేసే నిపుణ వ్యవసాయ AI సహాయకుడు.
మీకు విస్తృతమైన వ్యవసాయ జ్ఞానం మరియు రియల్-టైమ్ వాతావరణ డేటా అందుబాటులో ఉంది.

వ్యవసాయ జ్ఞాన స్థావరం:
{context}

రియల్-టైమ్ వాతావరణ మరియు వ్యవసాయ పరిస్థితులు:
{weather}

సంభాషణ చరిత్ర:
{history}

రైతు ప్రశ్న: {question}

సమగ్ర ప్రతిస్పందన కోసం సూచనలు:
1. ప్రస్తుత వాతావరణ పరిస్థితులు మరియు వ్యవసాయంపై వాటి ప్రభావాన్ని విశ్లేషించండి
2. వాతావరణ డేటాను జ్ఞాన స్థావరం నుండి వ్యవసాయ ఉత్తమ అభ్యాసాలతో అనుసంధానించండి
3. స్థానం మరియు ప్రస్తుత పరిస్థితులకు అనుకూలమైన నిర్దిష్ట, అమలు చేయగల సలహా అందించండి

ప్రతిస్పందన ఆకృతి:
🌤️ ప్రస్తుత పరిస్థితులు: [సంక్షిప్త వాతావరణ సారాంశం]
🌾 తక్షణ సిఫార్సులు: [వాతావరణ ఆధారంగా తక్షణ చర్యలు]
📋 వివరణాత్మక సలహా: [సమగ్ర వ్యవసాయ మార్గదర్శకత్వం]
⚠️ జాగ్రత్తలు: [వాతావరణ సంబంధిత ప్రమాదాలు మరియు నివారణ]

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

      // Enhanced location-based filtering
      if (options.userLocation) {
        const locationFilter = this.extractLocationContext(options.userLocation)
        Object.assign(filter, locationFilter)
      }

      // Perform similarity search with enhanced scoring
      const relevantDocs = await this.vectorStore.similaritySearchWithScore(
        query,
        8, // Increased to get more relevant documents
        Object.keys(filter).length > 0 ? filter : undefined,
      )

      // Enhanced context formatting with location relevance
      const context = relevantDocs
        .filter(([_, score]) => score > 0.6) // Slightly lower threshold for more context
        .map(([doc, score]) => {
          // Add location relevance boost
          const locationBoost = this.getLocationRelevanceBoost(doc, options.userLocation)
          const adjustedScore = Math.min(score + locationBoost, 1.0)
          
          return `${doc.pageContent} (Relevance: ${adjustedScore.toFixed(2)})`
        })
        .slice(0, 6) // Limit to top 6 most relevant
        .join("\n\n")

      if (!context) {
        return `No specific agricultural knowledge found for "${query}". I'll provide general farming advice based on current weather conditions.`
      }

      return context
    } catch (error) {
      console.error("Error retrieving context:", error)
      return "Agricultural knowledge retrieval temporarily unavailable. I'll provide advice based on available weather data and general farming practices."
    }
  }

  private extractLocationContext(location: string): Record<string, any> {
    const locationLower = location.toLowerCase()
    const filter: Record<string, any> = {}

    // State/Region mapping for better content filtering
    const stateRegionMap: Record<string, string[]> = {
      "north": ["punjab", "haryana", "himachal", "uttarakhand", "delhi", "chandigarh"],
      "south": ["tamil nadu", "kerala", "karnataka", "andhra pradesh", "telangana", "chennai", "bangalore", "hyderabad", "kochi"],
      "west": ["maharashtra", "gujarat", "rajasthan", "goa", "mumbai", "pune", "ahmedabad", "jaipur"],
      "east": ["west bengal", "bihar", "jharkhand", "odisha", "kolkata", "patna", "bhubaneswar"],
      "central": ["madhya pradesh", "chhattisgarh", "bhopal", "indore", "raipur"],
      "northeast": ["assam", "meghalaya", "manipur", "nagaland", "tripura", "arunachal", "mizoram", "sikkim"]
    }

    // Crop zone mapping
    const cropZoneMap: Record<string, string[]> = {
      "wheat_belt": ["punjab", "haryana", "up", "uttar pradesh", "mp", "madhya pradesh"],
      "rice_belt": ["west bengal", "odisha", "andhra pradesh", "tamil nadu", "assam", "bihar"],
      "cotton_belt": ["gujarat", "maharashtra", "telangana", "karnataka", "rajasthan"],
      "sugarcane_belt": ["uttar pradesh", "maharashtra", "karnataka", "tamil nadu"],
      "spice_belt": ["kerala", "tamil nadu", "karnataka", "andhra pradesh"],
      "millet_belt": ["rajasthan", "gujarat", "maharashtra", "karnataka", "telangana"]
    }

    // Climate zone mapping
    const climateZoneMap: Record<string, string[]> = {
      "arid": ["rajasthan", "gujarat", "haryana", "punjab"],
      "semi_arid": ["maharashtra", "karnataka", "telangana", "andhra pradesh"],
      "tropical": ["kerala", "tamil nadu", "goa", "mumbai"],
      "subtropical": ["punjab", "haryana", "delhi", "chandigarh"],
      "temperate": ["himachal", "uttarakhand", "kashmir", "sikkim"]
    }

    // Apply region filters
    for (const [region, states] of Object.entries(stateRegionMap)) {
      if (states.some(state => locationLower.includes(state))) {
        filter.region = region
        break
      }
    }

    // Apply crop zone filters
    for (const [zone, areas] of Object.entries(cropZoneMap)) {
      if (areas.some(area => locationLower.includes(area))) {
        filter.crop_zone = zone
        break
      }
    }

    // Apply climate zone filters
    for (const [climate, areas] of Object.entries(climateZoneMap)) {
      if (areas.some(area => locationLower.includes(area))) {
        filter.climate = climate
        break
      }
    }

    // Specific city/state filtering
    if (locationLower.includes("punjab") || locationLower.includes("haryana")) {
      filter.farming_type = "intensive_agriculture"
    } else if (locationLower.includes("kerala") || locationLower.includes("tamil nadu")) {
      filter.farming_type = "plantation_agriculture"
    } else if (locationLower.includes("rajasthan") || locationLower.includes("gujarat")) {
      filter.farming_type = "dryland_agriculture"
    }

    return filter
  }

  private getLocationRelevanceBoost(doc: any, userLocation?: string): number {
    if (!userLocation || !doc.metadata) return 0

    const locationLower = userLocation.toLowerCase()
    const content = (doc.pageContent || "").toLowerCase()
    const metadata = doc.metadata

    let boost = 0

    // Direct location mentions in content
    if (content.includes(locationLower)) {
      boost += 0.15
    }

    // State/region mentions
    const stateKeywords = ["punjab", "haryana", "kerala", "tamil nadu", "maharashtra", "gujarat", "rajasthan", "karnataka", "andhra pradesh", "west bengal", "bihar", "madhya pradesh"]
    const userState = stateKeywords.find(state => locationLower.includes(state))
    if (userState && content.includes(userState)) {
      boost += 0.1
    }

    // Climate-based relevance
    if (locationLower.includes("rajasthan") || locationLower.includes("gujarat")) {
      if (content.includes("drought") || content.includes("arid") || content.includes("water scarcity")) {
        boost += 0.05
      }
    }

    if (locationLower.includes("kerala") || locationLower.includes("mumbai")) {
      if (content.includes("monsoon") || content.includes("tropical") || content.includes("humidity")) {
        boost += 0.05
      }
    }

    return Math.min(boost, 0.2) // Cap boost at 0.2
  }

  private async getWeatherContext(location?: string): Promise<string> {
    if (!location) return ""

    try {
      // Get comprehensive weather data from OpenWeatherMap
      const weather = await this.weatherService.getWeatherData(location)
      if (!weather) return ""

      // Format comprehensive weather context for agricultural advice
      let weatherContext = `
CURRENT WEATHER CONDITIONS FOR ${location.toUpperCase()}:
- Temperature: ${weather.temperature}°C (feels like actual temperature)
- Humidity: ${weather.humidity}% (${this.getHumidityCategory(weather.humidity)})
- Rainfall: ${weather.rainfall}mm in last 24hrs (${this.getRainfallStatus(weather.rainfall)})
- Wind Speed: ${weather.windSpeed} km/h (${this.getWindCategory(weather.windSpeed)})
- Condition: ${weather.condition}
- Atmospheric Pressure: ${weather.pressure || 'N/A'} hPa
- Data Source: ${weather.source.toUpperCase()}

WEATHER FORECAST: ${weather.forecast}

AGRICULTURAL ADVISORY:
${weather.cropAdvisory || this.generateCropAdvisory(weather)}

WEATHER-BASED FARMING RECOMMENDATIONS:
${this.generateFarmingRecommendations(weather, location)}`

      // Add seasonal context
      const seasonalContext = this.getSeasonalContext(location)
      if (seasonalContext) {
        weatherContext += `\n\nSEASONAL CONTEXT: ${seasonalContext}`
      }

      return weatherContext
    } catch (error) {
      console.error("Error fetching weather:", error)
      return "Weather data temporarily unavailable. Please consider current local conditions."
    }
  }

  private getHumidityCategory(humidity: number): string {
    if (humidity >= 80) return "Very High - Disease risk"
    if (humidity >= 65) return "High - Monitor crops"
    if (humidity >= 45) return "Moderate - Ideal range"
    if (humidity >= 30) return "Low - Increase irrigation"
    return "Very Low - Drought stress risk"
  }

  private getRainfallStatus(rainfall: number): string {
    if (rainfall === 0) return "No rain - Irrigation needed"
    if (rainfall < 2.5) return "Light rain - Supplemental irrigation"
    if (rainfall < 7.5) return "Moderate rain - Good for crops"
    if (rainfall < 35) return "Heavy rain - Monitor drainage"
    return "Very heavy rain - Flood risk"
  }

  private getWindCategory(windSpeed: number): string {
    if (windSpeed < 5) return "Calm - Good for spraying"
    if (windSpeed < 15) return "Light breeze - Suitable for most activities"
    if (windSpeed < 25) return "Moderate wind - Avoid spraying"
    if (windSpeed < 35) return "Strong wind - Secure equipment"
    return "Very strong wind - Avoid field work"
  }

  private generateCropAdvisory(weather: any): string {
    const advisories: string[] = []
    
    // Temperature-based advice
    if (weather.temperature > 35) {
      advisories.push("HIGH HEAT ALERT: Provide shade for livestock, increase irrigation frequency, harvest early morning")
    } else if (weather.temperature < 10) {
      advisories.push("COLD WEATHER: Protect crops from frost, cover sensitive plants, check livestock shelters")
    } else if (weather.temperature >= 25 && weather.temperature <= 30) {
      advisories.push("OPTIMAL TEMPERATURE: Ideal conditions for most crop activities")
    }

    // Humidity-based advice
    if (weather.humidity > 85) {
      advisories.push("HIGH HUMIDITY: Monitor for fungal diseases (leaf blight, rust), improve ventilation, reduce nitrogen fertilizer")
    } else if (weather.humidity < 40) {
      advisories.push("LOW HUMIDITY: Increase irrigation frequency, apply mulch, protect from wilting")
    }

    // Rainfall-based advice
    if (weather.rainfall > 50) {
      advisories.push("HEAVY RAINFALL: Ensure proper drainage, avoid fertilizer application, watch for waterlogging")
    } else if (weather.rainfall > 10) {
      advisories.push("GOOD RAINFALL: Ideal for sowing, reduce irrigation, good time for transplanting")
    } else if (weather.rainfall === 0 && weather.temperature > 30) {
      advisories.push("DRY CONDITIONS: Maintain regular irrigation, consider drought-resistant varieties")
    }

    return advisories.length > 0 ? advisories.join(". ") : "Weather conditions are generally suitable for farming activities"
  }

  private generateFarmingRecommendations(weather: any, location: string): string {
    const recommendations: string[] = []
    const locationLower = location.toLowerCase()

    // Region-specific recommendations based on weather
    if (locationLower.includes("punjab") || locationLower.includes("haryana")) {
      if (weather.temperature > 35) {
        recommendations.push("Wheat belt region: Ensure adequate water for wheat/rice rotation, check tube well operations")
      }
      if (weather.rainfall < 5) {
        recommendations.push("Punjab/Haryana: Optimize water usage, consider laser land leveling for efficiency")
      }
    } else if (locationLower.includes("kerala") || locationLower.includes("tamil nadu")) {
      if (weather.humidity > 80) {
        recommendations.push("Coastal region: Monitor spice crops for fungal issues, ensure good drainage for coconut palms")
      }
      if (weather.rainfall > 25) {
        recommendations.push("South India: Good for rice cultivation, check pepper and cardamom estates")
      }
    } else if (locationLower.includes("rajasthan") || locationLower.includes("gujarat")) {
      if (weather.temperature > 40) {
        recommendations.push("Arid region: Focus on drought-resistant crops like bajra/jowar, check drip irrigation systems")
      }
      if (weather.rainfall > 0) {
        recommendations.push("Desert region: Excellent opportunity for rainwater harvesting, sow drought-tolerant varieties")
      }
    } else if (locationLower.includes("maharashtra")) {
      if (weather.rainfall > 15) {
        recommendations.push("Maharashtra: Good for sugarcane and cotton, monitor for pink bollworm in cotton")
      }
      if (weather.temperature < 15) {
        recommendations.push("Maharashtra: Ideal for grape cultivation, good time for pruning operations")
      }
    }

    // Seasonal farming activities based on weather
    const month = new Date().getMonth() + 1
    if (month >= 6 && month <= 9) { // Monsoon season
      recommendations.push("MONSOON SEASON: Focus on kharif crops (rice, cotton, sugarcane), prepare drainage systems")
    } else if (month >= 10 && month <= 3) { // Post-monsoon/Winter
      recommendations.push("RABI SEASON: Ideal for wheat, barley, mustard, gram - use residual soil moisture")
    } else { // Summer season
      recommendations.push("SUMMER SEASON: Focus on irrigation, summer vegetables, fodder crops")
    }

    // Weather-specific immediate actions
    if (weather.windSpeed > 20) {
      recommendations.push("WIND ALERT: Secure greenhouse structures, avoid pesticide/fungicide spraying, check plant supports")
    }

    if (weather.pressure && weather.pressure < 1000) {
      recommendations.push("LOW PRESSURE: Weather change expected, postpone harvest if crops are ready, secure loose materials")
    }

    return recommendations.length > 0 ? recommendations.join(". ") : "Continue regular farming operations as per seasonal calendar"
  }

  private getSeasonalContext(location: string): string {
    const month = new Date().getMonth() + 1
    const locationLower = location.toLowerCase()

    // Current season in India
    if (month >= 6 && month <= 9) {
      return "Monsoon/Kharif season - Focus on rice, cotton, sugarcane, pulses. Good time for planting."
    } else if (month >= 10 && month <= 3) {
      return "Post-monsoon/Rabi season - Ideal for wheat, barley, mustard, chickpea. Utilize residual moisture."
    } else {
      return "Summer season - Focus on irrigation management, summer vegetables, fodder crops."
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

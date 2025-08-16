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

RESPONSE FORMAT - MANDATORY STRUCTURE:
You MUST format your response EXACTLY as follows with emojis and clear sections:

🌤️ CURRENT CONDITIONS: [Brief weather summary and impact on farming]

🌾 IMMEDIATE RECOMMENDATIONS: [Urgent actions to take based on current weather]

📋 DETAILED ADVICE: [Step-by-step farming guidance with specific quantities and methods]

⚠️ PRECAUTIONS: [Weather-related risks and specific prevention measures]

📅 TIMING: [Best times for suggested activities with specific timeframes]

FORMATTING RULES:
- Use bullet points (•) within sections for multiple items
- Keep each section concise but actionable
- Include specific numbers when relevant
- Write in simple, practical language
- NO asterisks (*) or markdown formatting other than emojis

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

उत्तर प्रारूप - अनिवार्य संरचना:
आपको अपना उत्तर बिल्कुल इस प्रारूप में इमोजी और स्पष्ट खंडों के साथ देना होगा:

🌤️ वर्तमान स्थितियां: [संक्षिप्त मौसम सारांश और खेती पर प्रभाव]

🌾 तत्काल सिफारिशें: [वर्तमान मौसम के आधार पर तुरंत करने योग्य कार्य]

📋 विस्तृत सलाह: [विशिष्ट मात्रा और विधियों के साथ चरणबद्ध कृषि मार्गदर्शन]

⚠️ सावधानियां: [मौसम संबंधी जोखिम और विशिष्ट रोकथाम उपाय]

📅 समय: [विशिष्ट समयसीमा के साथ सुझावित गतिविधियों के लिए सर्वोत्तम समय]

प्रारूपण नियम:
- खंडों के भीतर कई आइटमों के लिए बुलेट पॉइंट्स (•) का उपयोग करें
- प्रत्येक खंड को संक्षिप्त लेकिन कार्यान्वित करने योग्य रखें
- प्रासंगिक होने पर विशिष्ट संख्याओं को शामिल करें
- सरल, व्यावहारिक भाषा में लिखें
- इमोजी के अलावा कोई तारांकन (*) या मार्कडाउन फॉर्मेटिंग नहीं

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

ప్రతిస్పందన ఆకృతి - తప్పనిసరి నిర్మాణం:
మీరు మీ సమాధానాన్ని ఖచ్చితంగా ఈ విధంగా ఇమోజీలు మరియు స్పష్టమైన విభాగాలతో ఫార్మాట్ చేయాలి:

🌤️ ప్రస్తుత పరిస్థితులు: [సంక్షిప్త వాతావరణ సారాంశం మరియు వ్యవసాయంపై ప్రభావం]

🌾 తక్షణ సిఫార్సులు: [ప్రస్తుత వాతావరణం ఆధారంగా తక్షణ తీసుకోవాల్సిన చర్యలు]

📋 వివరణాత్మక సలహా: [నిర్దిష్ట పరిమాణాలు మరియు పద్ధతులతో దశల వారీ వ్యవసాయ మార్గదర్శకత్వం]

⚠️ జాగ్రత్తలు: [వాతావరణ సంబంధిత ప్రమాదాలు మరియు నిర్దిష్ట నివారణ చర్యలు]

📅 సమయం: [నిర్దిష్ట కాలపరిమితులతో సూచించబడిన కార్యకలాపాలకు ఉత్తమ సమయాలు]

ఫార్మేటింగ్ నియమాలు:
- విభాగాలలో బహుళ అంశాలకు బుల్లెట్ పాయింట్లు (•) ఉపయోగించండి
- ప్రతి విభాగాన్ని సంక్షిప్తంగా కానీ అమలు చేయగలిగేలా ఉంచండి
- సంబంధితంగా ఉన్నప్పుడు నిర్దిష్ట సంఖ్యలను చేర్చండి
- సరళమైన, ఆచరణాత్మక భాషలో వ్రాయండి
- ఇమోజీలు కాకుండా ఎటువంటి ఆస్టెరిస్క్‌లు (*) లేదా మార్క్‌డౌన్ ఫార్మేటింగ్ లేకుండా

సమాధానం:`,

      bn: `আপনি KrishiGPT, ভারতের কৃষকদের সাহায্যকারী একজন বিশেষজ্ঞ কৃষি AI সহায়ক।
আপনার কাছে ব্যাপক কৃষি জ্ঞান এবং রিয়েল-টাইম আবহাওয়া ডেটা রয়েছে।

কৃষি জ্ঞান ভিত্তি:
{context}

রিয়েল-টাইম আবহাওয়া এবং কৃষি পরিস্থিতি:
{weather}

কৃষকের প্রশ্ন: {question}

ব্যাপক উত্তরের জন্য নির্দেশনা:
1. বর্তমান আবহাওয়া পরিস্থিতি এবং কৃষিতে তাদের প্রভাব বিশ্লেষণ করুন
2. আবহাওয়া ডেটাকে জ্ঞান ভিত্তি থেকে কৃষি সর্বোত্তম অনুশীলনের সাথে সংযুক্ত করুন
3. অবস্থান এবং বর্তমান পরিস্থিতির জন্য নির্দিষ্ট, কার্যকর পরামর্শ প্রদান করুন

উত্তরের বিন্যাস - বাধ্যতামূলক কাঠামো:
আপনাকে অবশ্যই আপনার উত্তর ঠিক এই ফরম্যাটে ইমোজি এবং স্পষ্ট অংশের সাথে দিতে হবে:

🌤️ বর্তমান পরিস্থিতি: [সংক্ষিপ্ত আবহাওয়া সারসংক্ষেপ এবং কৃষিতে প্রভাব]

🌾 তাৎক্ষণিক সুপারিশ: [বর্তমান আবহাওয়ার ভিত্তিতে জরুরি পদক্ষেপ]

📋 বিস্তারিত পরামর্শ: [নির্দিষ্ট পরিমাণ এবং পদ্ধতি সহ ধাপে ধাপে কৃষি নির্দেশনা]

⚠️ সতর্কতা: [আবহাওয়া সম্পর্কিত ঝুঁকি এবং নির্দিষ্ট প্রতিরোধমূলক ব্যবস্থা]

📅 সময়: [নির্দিষ্ট সময়সীমা সহ প্রস্তাবিত কার্যক্রমের জন্য সর্বোত্তম সময়]

ফরম্যাটিং নিয়ম:
- বিভাগের মধ্যে একাধিক আইটেমের জন্য বুলেট পয়েন্ট (•) ব্যবহার করুন
- প্রতিটি বিভাগ সংক্ষিপ্ত কিন্তু কার্যকর রাখুন
- প্রাসঙ্গিক হলে নির্দিষ্ট সংখ্যা অন্তর্ভুক্ত করুন
- সহজ, ব্যবহারিক ভাষায় লিখুন
- ইমোজি ছাড়া কোন তারকা চিহ্ন (*) বা মার্কডাউন ফরম্যাটিং নয়

উত্তর:`,

      ta: `நீங்கள் KrishiGPT, இந்தியாவின் விவசாயிகளுக்கு உதவும் ஒரு நிபுணர் விவசாய AI உதவியாளர்.
உங்களிடம் விரிவான விவசாய அறிவும் நிகழ்நேர வானிலை தரவும் உள்ளது।

விவசாய அறிவு தளம்:
{context}

நிகழ்நேர வானிலை மற்றும் விவசாய நிலைமைகள்:
{weather}

விவசாயியின் கேள்வி: {question}

விரிவான பதிலுக்கான வழிகாட்டுதல்கள்:
1. தற்போதைய வானிலை நிலைமைகள் மற்றும் விவசாயத்தில் அவற்றின் தாக்கத்தை பகுப்பாய்வு செய்யுங்கள்
2. வானிலை தரவை அறிவுத் தளத்திலிருந்து விவசாய சிறந்த நடைமுறைகளுடன் இணைக்கவும்
3. இடம் மற்றும் தற்போதைய நிலைமைகளுக்கு ஏற்ற குறிப்பிட்ட, செயல்படுத்தக்கூடிய ஆலோசனையை வழங்கவும்

பதில் வடிவம் - கட்டாய கட்டமைப்பு:
நீங்கள் உங்கள் பதிலை ஈமோஜி மற்றும் தெளிவான பிரிவுகளுடன் சரியாக இந்த வடிவத்தில் கொடுக்க வேண்டும்:

🌤️ தற்போதைய நிலைமைகள்: [சுருக்கமான வானிலை சுருக்கம் மற்றும் விவசாயத்தில் தாக்கம்]

🌾 உடனடி பரிந்துரைகள்: [தற்போதைய வானிலை அடிப்படையில் அவசர நடவடிக்கைகள்]

📋 விரிவான ஆலோசனை: [குறிப்பிட்ட அளவுகள் மற்றும் முறைகளுடன் படிப்படியான விவசாய வழிகாட்டுதல்]

⚠️ முன்னெச்சரிக்கைகள்: [வானிலை தொடர்பான அபாயங்கள் மற்றும் குறிப்பிட்ட தடுப்பு நடவடிக்கைகள்]

📅 நேரம்: [குறிப்பிட்ட கால அளவுகளுடன் பரிந்துரைக்கப்பட்ட செயல்பாடுகளுக்கான சிறந்த நேரங்கள்]

வடிவமைப்பு விதிகள்:
- பிரிவுகளுக்குள் பல உருப்படிகளுக்கு புல்லட் புள்ளிகள் (•) பயன்படுத்தவும்
- ஒவ்வொரு பிரிவையும் சுருக்கமாக ஆனால் செயல்படுத்தக்கூடியதாக வைத்திருங்கள்
- பொருத்தமானபோது குறிப்பிட்ட எண்களை சேர்க்கவும்
- எளிய, நடைமுறை மொழியில் எழுதுங்கள்
- ஈமோஜி தவிர நட்சத்திரங்கள் (*) அல்லது மார்க்டவுன் வடிவமைப்பு இல்லை

பதில்:`,
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
      const rawResponse = await chain.invoke({ question: query })
      
      // Format the response to ensure proper structure
      const formattedResponse = this.formatAIResponse(rawResponse.trim(), options.language)

      console.log(`Generated response using LangChain RAG for query: ${query}`)
      return formattedResponse
    } catch (error) {
      console.error("Error in RAG chain:", error)

      // Fallback to basic response
      return this.getFallbackResponse(query, options)
    }
  }

  private formatAIResponse(response: string, language = "en"): string {
    // Remove any unwanted asterisks or markdown formatting
    let cleanResponse = response
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '') // Remove italic markdown
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/^\s*-\s/gm, '• ') // Convert dashes to bullets
      .replace(/^\s*\*\s/gm, '• ') // Convert asterisks to bullets
      .trim()

    // Check if response already has proper emoji format
    const hasEmojiFormat = [
      '🌤️',
      '🌾', 
      '📋',
      '⚠️',
      '📅'
    ].some(emoji => cleanResponse.includes(emoji))

    if (hasEmojiFormat) {
      // Response already has emoji format, just clean it up
      return cleanResponse
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n')
    }

    // If response doesn't have emoji format, try to structure it
    const sections = this.extractResponseSections(cleanResponse, language)
    return this.buildFormattedResponse(sections, language)
  }

  private extractResponseSections(response: string, language: string): any {
    // Try to identify different sections based on content patterns
    const lines = response.split('\n').filter(line => line.trim().length > 0)
    
    return {
      conditions: this.findConditionsContent(lines),
      recommendations: this.findRecommendationsContent(lines),
      advice: this.findAdviceContent(lines),
      precautions: this.findPrecautionsContent(lines),
      timing: this.findTimingContent(lines)
    }
  }

  private findConditionsContent(lines: string[]): string {
    // Look for weather-related content in first few lines
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].toLowerCase()
      if (line.includes('weather') || line.includes('temperature') || line.includes('humid') || 
          line.includes('rain') || line.includes('condition') || line.includes('climate')) {
        return lines[i]
      }
    }
    return "Current weather conditions are favorable for farming activities."
  }

  private findRecommendationsContent(lines: string[]): string {
    // Look for action words and recommendations
    const actionWords = ['should', 'must', 'recommend', 'suggest', 'immediate', 'urgent', 'now', 'today']
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      if (actionWords.some(word => lowerLine.includes(word))) {
        return line
      }
    }
    return "Continue regular farming practices based on current conditions."
  }

  private findAdviceContent(lines: string[]): string {
    // Look for detailed farming advice
    const adviceWords = ['farming', 'crop', 'soil', 'plant', 'seed', 'fertilizer', 'irrigation', 'harvest']
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      if (adviceWords.some(word => lowerLine.includes(word)) && line.length > 50) {
        return line
      }
    }
    return "Follow standard agricultural practices for your region and crop type."
  }

  private findPrecautionsContent(lines: string[]): string {
    // Look for warnings or precautions
    const warningWords = ['avoid', 'prevent', 'caution', 'risk', 'danger', 'protect', 'watch', 'monitor']
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      if (warningWords.some(word => lowerLine.includes(word))) {
        return line
      }
    }
    return "Monitor crops regularly and maintain good agricultural practices."
  }

  private findTimingContent(lines: string[]): string {
    // Look for timing-related content
    const timingWords = ['morning', 'evening', 'day', 'week', 'month', 'time', 'when', 'schedule']
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      if (timingWords.some(word => lowerLine.includes(word))) {
        return line
      }
    }
    return "Follow seasonal agricultural calendar for optimal timing."
  }

  private buildFormattedResponse(sections: any, language: string): string {
    const templates = {
      en: `🌤️ CURRENT CONDITIONS: ${sections.conditions}

🌾 IMMEDIATE RECOMMENDATIONS: ${sections.recommendations}

📋 DETAILED ADVICE: ${sections.advice}

⚠️ PRECAUTIONS: ${sections.precautions}

📅 TIMING: ${sections.timing}`,

      hi: `🌤️ वर्तमान स्थितियां: ${sections.conditions}

🌾 तत्काल सिफारिशें: ${sections.recommendations}

📋 विस्तृत सलाह: ${sections.advice}

⚠️ सावधानियां: ${sections.precautions}

📅 समय: ${sections.timing}`,

      te: `🌤️ ప్రస్తుత పరిస్థితులు: ${sections.conditions}

🌾 తక్షణ సిఫార్సులు: ${sections.recommendations}

📋 వివరణాత్మక సలహా: ${sections.advice}

⚠️ జాగ్రత్తలు: ${sections.precautions}

📅 సమయం: ${sections.timing}`,

      bn: `🌤️ বর্তমান পরিস্থিতি: ${sections.conditions}

🌾 তাৎক্ষণিক সুপারিশ: ${sections.recommendations}

📋 বিস্তারিত পরামর্শ: ${sections.advice}

⚠️ সতর্কতা: ${sections.precautions}

📅 সময়: ${sections.timing}`,

      ta: `🌤️ தற்போதைய நிலைமைகள்: ${sections.conditions}

🌾 உடனடி பரிந்துரைகள்: ${sections.recommendations}

📋 விரிவான ஆலோசனை: ${sections.advice}

⚠️ முன்னெச்சரிக்கைகள்: ${sections.precautions}

📅 நேரம்: ${sections.timing}`
    }

    return templates[language as keyof typeof templates] || templates.en
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

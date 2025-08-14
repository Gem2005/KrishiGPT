import type { RetrievalResult } from "./retrieval"
import { AIServiceManager } from "../ai/providers"

export interface GenerationOptions {
  language: string
  maxTokens?: number
  temperature?: number
  userLocation?: string
  weatherData?: any
}

export class GenerationService {
  private aiManager = new AIServiceManager()

  async generateResponse(
    query: string,
    retrievedKnowledge: RetrievalResult[],
    options: GenerationOptions = { language: "en" },
  ): Promise<string> {
    try {
      // Check if this is a farming question that needs location
      const needsLocation = this.requiresLocationContext(query)

      console.log(`Query: "${query}", needsLocation: ${needsLocation}, userLocation: ${options.userLocation}`)

      if (needsLocation && !options.userLocation) {
        console.log("Asking for location")
        return this.askForLocation(options.language)
      }

      if (options.userLocation && needsLocation) {
        console.log("Generating location-specific advice")
        try {
          return await this.generateLocationSpecificAdvice(query, retrievedKnowledge, options)
        } catch (error) {
          console.error("Error generating location-specific advice:", error)
          return this.getLocationAwareFallback(query, options)
        }
      }

      console.log("Generating standard response")
      const context = retrievedKnowledge
        .map((item) => `Title: ${item.title}\nCategory: ${item.category}\nContent: ${item.content}`)
        .join("\n\n---\n\n")

      const systemPrompt = this.getEnhancedSystemPrompt(options.language, !!options.userLocation)

      const result = await this.aiManager.generateWithFailover(
        `Context Information:
${context}

User Question: ${query}

Please provide a helpful response based on the context above.`,
        systemPrompt,
      )

      console.log(`Response generated using ${result.provider} (attempt ${result.attempts})`)
      return result.text
    } catch (error) {
      console.error("Error generating response:", error)
      if (options.userLocation) {
        return this.getLocationAwareFallback(query, options)
      }
      return this.getFallbackResponse(options.language)
    }
  }

  private async generateLocationSpecificAdvice(
    query: string,
    retrievedKnowledge: RetrievalResult[],
    options: GenerationOptions,
  ): Promise<string> {
    const context = retrievedKnowledge
      .map((item) => `Title: ${item.title}\nCategory: ${item.category}\nContent: ${item.content}`)
      .join("\n\n---\n\n")

    // Add weather context if available
    let weatherContext = ""
    if (options.weatherData) {
      weatherContext = `\n\nCurrent Weather in ${options.userLocation}:
🌡️ Temperature: ${options.weatherData.temperature}°C
💧 Humidity: ${options.weatherData.humidity}%
🌧️ Rainfall: ${options.weatherData.rainfall}mm
💨 Wind: ${options.weatherData.windSpeed} km/h
☁️ Condition: ${options.weatherData.condition}`
    }

    const systemPrompt = this.getLocationSpecificPrompt(options.language)

    const result = await this.aiManager.generateWithFailover(
      `Location: ${options.userLocation}
Weather Information: ${weatherContext}

Agricultural Knowledge Context:
${context}

Farmer's Question: ${query}

Provide specific advice for this location and current weather conditions. Include practical steps the farmer can take right now.`,
      systemPrompt,
    )

    console.log(`Location-specific advice generated using ${result.provider}`)
    return result.text
  }

  private getLocationSpecificPrompt(language: string): string {
    const prompts = {
      en: `You are KrishiGPT, helping a farmer with location-specific agricultural advice.

RESPONSE FORMAT:
1. Give 3-4 sentences of practical advice
2. Consider the current weather conditions
3. Mention specific actions for their location
4. Include timing recommendations if relevant

Be helpful, specific, and actionable. Focus on what the farmer should do NOW based on their location and weather.`,

      hi: `आप KrishiGPT हैं, एक किसान को स्थान-विशिष्ट कृषि सलाह दे रहे हैं।

उत्तर का प्रारूप:
1. 3-4 वाक्यों में व्यावहारिक सलाह दें
2. वर्तमान मौसम की स्थिति पर विचार करें
3. उनके स्थान के लिए विशिष्ट कार्य बताएं
4. यदि प्रासंगिक हो तो समय की सिफारिश शामिल करें

सहायक, विशिष्ट और कार्यान्वित करने योग्य रहें।`,

      te: `మీరు KrishiGPT, ఒక రైతుకు స్థాన-నిర్దిష్ట వ్యవసాయ సలహా ఇస్తున్నారు।

సమాధాన ఆకృతి:
1. 3-4 వాక్యాలలో ఆచరణాత్మక సలహా ఇవ్వండి
2. ప్రస్తుత వాతావరణ పరిస్థితులను పరిగణించండి
3. వారి స్థానానికి నిర్దిష్ట చర్యలను పేర్కొనండి
4. సంబంధితమైతే సమయ సిఫార్సులను చేర్చండి

సహాయకరంగా, నిర్దిష్టంగా మరియు అమలు చేయగలిగేలా ఉండండి।`,
    }

    return prompts[language as keyof typeof prompts] || prompts.en
  }

  private requiresLocationContext(query: string): boolean {
    const locationKeywords = [
      // English
      "grow",
      "plant",
      "crop",
      "farming",
      "weather",
      "rain",
      "season",
      "harvest",
      "soil",
      "fertilizer",
      "pest",
      "disease",
      "irrigation",
      "sowing",
      "cultivation",
      "agriculture",
      "field",
      "farm",
      // Hindi (transliterated)
      "ugana",
      "fasal",
      "kheti",
      "mausam",
      "barish",
      // Telugu (transliterated)
      "panta",
      "saagu",
      "vaayu",
      "nela",
      "raithu",
    ]

    const queryLower = query.toLowerCase()
    return locationKeywords.some((keyword) => queryLower.includes(keyword))
  }

  private askForLocation(language: string): string {
    const locationRequests = {
      en: "Which village are you from? I need your location to give better farming advice.",
      hi: "आप किस गांव से हैं? बेहतर खेती की सलाह के लिए मुझे आपका स्थान चाहिए।",
      te: "మీరు ఏ గ్రామం నుండి వచ్చారు? మంచి వ్యవసాయ సలహా కోసం మీ స్థానం కావాలి।",
    }

    return locationRequests[language as keyof typeof locationRequests] || locationRequests.en
  }

  private getEnhancedSystemPrompt(language: string, hasLocation: boolean): string {
    const prompts = {
      en: `You are KrishiGPT, a helpful farming assistant for Indian farmers. 

IMPORTANT RESPONSE RULES:
- Keep responses SHORT (maximum 2-3 sentences)
- Use SIMPLE language that farmers can understand
- Be DIRECT and practical
- Give specific actionable advice
- If asking follow-up questions, ask only ONE question at a time

Your expertise: crop management, pest control, weather advice, soil health, fertilizers, irrigation, market prices.

${
  hasLocation
    ? `The farmer has shared their location. Use local weather and conditions to give specific advice.`
    : `If the farmer asks about crops/farming but hasn't shared location, ask for their village and state in a short, friendly way.`
}`,

      hi: `आप KrishiGPT हैं, भारतीय किसानों के लिए एक सहायक कृषि सलाहकार।

महत्वपूर्ण जवाब नियम:
- जवाब छोटे रखें (अधिकतम 2-3 वाक्य)
- सरल भाषा का उपयोग करें जो किसान समझ सकें
- सीधी और व्यावहारिक सलाह दें
- एक समय में केवल एक प्रश्न पूछें

आपकी विशेषज्ञता: फसल प्रबंधन, कीट नियंत्रण, मौसम सलाह, मिट्टी की सेहत।`,

      te: `మీరు KrishiGPT, భారతీయ రైతులకు సహాయకమైన వ్యవసాయ సలహాదారు.

ముఖ్యమైన సమాధాన నియమాలు:
- సమాధానాలను చిన్నగా ఉంచండి (గరిష్టంగా 2-3 వాక్యాలు)
- రైతులు అర్థం చేసుకునే సరళమైన భాష వాడండి
- ప్రత్యక్షమైన మరియు ఆచరణాత్మక సలహా ఇవ్వండి
- ఒక సమయంలో ఒకే ప్రశ్న అడగండి

మీ నైపుణ్యం: పంట నిర్వహణ, కీటకాలు నియంత్రణ, వాతావరణ సలహా, మట్టి ఆరోగ్యం.`,
    }

    return prompts[language as keyof typeof prompts] || prompts.en
  }

  private getSystemPrompt(language: string): string {
    const prompts = {
      en: `You are KrishiGPT, an expert agricultural AI assistant. You help farmers with:
- Crop management and cultivation techniques
- Pest and disease identification and treatment
- Weather-based farming advice
- Soil health and fertilization
- Sustainable farming practices
- Market information and crop planning

Provide practical, actionable advice. Be concise but thorough. Always prioritize farmer safety and sustainable practices.`,

      hi: `आप KrishiGPT हैं, एक विशेषज्ञ कृषि AI सहायक। आप किसानों की मदद करते हैं:
- फसल प्रबंधन और खेती की तकनीकों में
- कीट और रोग की पहचान और उपचार में
- मौसम आधारित खेती की सलाह में
- मिट्टी की सेहत और उर्वरीकरण में
- टिकाऊ खेती के तरीकों में
- बाजार की जानकारी और फसल योजना में

व्यावहारिक, कार्यान्वित करने योग्य सलाह दें। संक्षिप्त लेकिन विस्तृत रहें।`,

      te: `మీరు KrishiGPT, ఒక నిపుణుడైన వ్యవసాయ AI సహాయకుడు. మీరు రైతులకు సహాయం చేస్తారు:
- పంట నిర్వహణ మరియు సాగు పద్ధతులలో
- కీటకాలు మరియు వ్యాధుల గుర్తింపు మరియు చికిత్సలో
- వాతావరణ ఆధారిత వ్యవసాయ సలహాలో
- మట్టి ఆరోగ్యం మరియు ఎరువుల వాడకలో
- స్థిరమైన వ్యవసాయ పద్ధతులలో
- మార్కెట్ సమాచారం మరియు పంట ప్రణాళికలో

ఆచరణాత్మక, అమలు చేయగల సలహాలు ఇవ్వండి।`,
    }

    return prompts[language as keyof typeof prompts] || prompts.en
  }

  private getFallbackResponse(language: string): string {
    const responses = {
      en: "I apologize, but I'm experiencing technical difficulties. Please try asking your question again, or contact our support team for assistance with your agricultural query.",
      hi: "मुझे खुशी है, लेकिन मुझे तकनीकी समस्याओं का सामना कर रहा हूं। कृपया अपना प्रश्न फिर से पूछें, या अपनी कृषि संबंधी समस्या के लिए हमारी सहायता टीम से संपर्क करें।",
      te: "క్షమించండి, నేను సాంకేతిక సమస్యలను ఎదుర్కొంటున్నాను. దయచేసి మీ ప్రశ్నను మళ్లీ అడగండి, లేదా మీ వ్యవసాయ ప్రశ్న కోసం మా సహాయ బృందాన్ని సంప్రదించండి.",
    }

    return responses[language as keyof typeof responses] || responses.en
  }

  private getLocationAwareFallback(query: string, options: GenerationOptions): string {
    const { userLocation, language, weatherData } = options
    const lowerQuery = query.toLowerCase()

    let advice = ""
    const locationText = userLocation ? ` in ${userLocation}` : ""
    const weatherText = weatherData
      ? ` Current conditions: ${weatherData.temperature}°C, ${weatherData.condition}.`
      : ""

    if (lowerQuery.includes("rice") || lowerQuery.includes("धान") || lowerQuery.includes("వరి")) {
      if (language === "hi") {
        advice = `${userLocation} में धान की खेती के लिए सुझाव:${weatherText} अभी जून-जुलाई का समय है तो धान की बुआई करें। खेत में 2-3 इंच पानी बनाए रखें। पूसा बासमती या स्वर्णा किस्म का चुनाव करें। 15 दिन में खरपतवार निकालें।`
      } else if (language === "te") {
        advice = `${userLocation}లో వరి సాగు కోసం సలహా:${weatherText} ఇప్పుడు జూన్-జూలై సమయం అయితే వరి నాటండి. పొలంలో 2-3 అంగుళాల నీరు నిలిచేలా చూడండి. BPT లేదా స్వర్ణ రకాలు ఎంచుకోండి. 15 రోజులకు కలుపు మొక్కలు తీయండి.`
      } else {
        advice = `Rice cultivation advice for ${userLocation}:${weatherText} If it's June-July, start rice planting now. Maintain 2-3 inches of water in fields. Choose varieties like Pusa Basmati or Swarna. Remove weeds after 15 days. Apply urea fertilizer in 3 splits.`
      }
    } else if (lowerQuery.includes("when") || lowerQuery.includes("time") || lowerQuery.includes("season")) {
      if (language === "hi") {
        advice = `${userLocation} में फसल का समय:${weatherText} खरीफ फसलें (जून-जुलाई): धान, मक्का, कपास। रबी फसलें (अक्टूबर-नवंबर): गेहूं, चना, सरसों। जायद फसलें (मार्च-अप्रिल): तरबूज, खीरा। मौसम देखकर बुआई करें।`
      } else if (language === "te") {
        advice = `${userLocation}లో పంట కాలక్రమం:${weatherText} ఖరీఫ్ పంటలు (జూన్-జూలై): వరి, మొక్కజొన్న, పత్తి. రబీ పంటలు (అక్టోబర్-నవంబర్): గోధుమలు, శనగలు, ఆవాలు. జాయిద్ పంటలు (మార్చి-ఏప్రిల్): పుచ్చకాయలు, దోసకాయలు. వాతావరణం చూసి నాటండి.`
      } else {
        advice = `Crop timing for ${userLocation}:${weatherText} Kharif crops (June-July): Rice, corn, cotton. Rabi crops (October-November): Wheat, chickpea, mustard. Zaid crops (March-April): Watermelon, cucumber. Always check local weather before planting.`
      }
    } else if (lowerQuery.includes("weather") || lowerQuery.includes("rain") || lowerQuery.includes("monsoon")) {
      if (language === "hi") {
        advice = `${userLocation} में मौसम आधारित खेती:${weatherText} बारिश में धान, मक्का लगाएं। सूखे में ड्रिप सिंचाई करें। तेज हवा से फसल को बचाने के लिए विंडब्रेक लगाएं। मौसम पूर्वानुमान देखते रहें।`
      } else if (language === "te") {
        advice = `${userLocation}లో వాతావరణ ఆధారిత వ్యవసాయం:${weatherText} వర్షాకాలంలో వరి, మొక్కజొన్న పండించండి. కరువులో డ్రిప్ నీటిపారుదల చేయండి. గాలుల నుండి పంటలను కాపాడేందుకు గాలి అడ్డుగోడలు వేయండి. వాతావరణ సమాచారం తెలుసుకోండి.`
      } else {
        advice = `Weather-based farming for ${userLocation}:${weatherText} During monsoon, grow rice and corn. In dry periods, use drip irrigation. Install windbreaks to protect crops from strong winds. Monitor weather forecasts regularly for better planning.`
      }
    } else {
      if (language === "hi") {
        advice = `${userLocation} में कृषि सलाह:${weatherText} मिट्टी की जांच कराकर pH 6-7 रखें। उन्नत बीजों का उपयोग करें। NPK खाद का संतुलित उपयोग करें। कीट-रोग की नियमित निगरानी करें। स्थानीय कृषि विभाग से सलाह लें।`
      } else if (language === "te") {
        advice = `${userLocation}లో వ్యవసాయ సలహా:${weatherText} మట్టి పరీక్ష చేయించి pH 6-7 ఉంచండి. మెరుగైన విత్తనాలు వాడండి. NPK ఎరువుల సమతుల్య వాడకం చేయండి. కీటకాలు, వ్యాధుల క్రమ పరిశీలన చేయండి. స్థానిక వ్యవసాయ శాఖను సంప్రదించండి.`
      } else {
        advice = `Agricultural guidance for ${userLocation}:${weatherText} Test soil and maintain pH 6-7. Use certified quality seeds. Apply balanced NPK fertilizers. Monitor regularly for pests and diseases. Consult local agricultural extension services for area-specific advice.`
      }
    }

    return advice
  }

  getAvailableAIServices(): string[] {
    return this.aiManager.getAvailableProviders()
  }
}

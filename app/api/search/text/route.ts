import { type NextRequest, NextResponse } from "next/server"
import { KrishiRAGChain } from "@/lib/langchain/rag-chain"
import { WeatherService } from "@/lib/weather/service"

function isViabilityQuestion(query: string): boolean {
  const queryLower = query.toLowerCase()
  
  const viabilityIndicators = [
    "should i grow", "should i plant", "should i cultivate",
    "is it profitable", "is it worth", "economic viability",
    "profitable to grow", "good to grow", "recommend growing",
    "worth growing", "invest in", "start growing",
    "क्या मुझे", "उगाना चाहिए", "फायदेमंद है", "लाभकारी है"
  ]

  return viabilityIndicators.some(indicator => queryLower.includes(indicator))
}

export async function POST(request: NextRequest) {
  try {
    const { query, language = "en", userLocation } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    console.log(
      `LangChain Search API called with query: "${query}", location: "${userLocation}", language: "${language}"`,
    )

    // Initialize services
    const ragChain = new KrishiRAGChain()
    const weatherService = new WeatherService()

    let weatherData = null

    // Get weather data if location is provided
    if (userLocation) {
      try {
        console.log(`Fetching weather data for: ${userLocation}`)
        weatherData = await weatherService.getWeatherData(userLocation)
        console.log(`Weather data fetched:`, weatherData)
      } catch (weatherError) {
        console.log("Weather service error, using mock data:", weatherError)
        weatherData = {
          temperature: 28,
          humidity: 70,
          condition: "Partly cloudy",
          description: "Good conditions for farming activities",
        }
      }
    }

    try {
      // Use LangChain RAG system to generate response
      console.log("Generating response using LangChain RAG...")

      // Check if this is a viability question that would benefit from market analysis
      const includeMarketAnalysis = isViabilityQuestion(query)
      
      const aiResponse = await ragChain.generateResponse(query, {
        userLocation,
        language,
        weatherData,
        includeMarketAnalysis,
      })

      console.log(`LangChain RAG response generated successfully (market analysis: ${includeMarketAnalysis})`)

      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error("RAG system generated empty response")
      }

      return NextResponse.json({
        results: [
          {
            id: Date.now().toString(),
            title: userLocation ? `Agricultural Advice for ${userLocation}` : "KrishiGPT AI Assistant",
            content: aiResponse,
            category: "langchain_rag",
            subcategory: "ai_generated",
            language: language,
            tags: ["ai", "langchain", "rag", "farming"],
            similarity: 1.0,
            source: "langchain_rag",
            weatherData: weatherData,
          },
        ],
        query,
        language,
        userLocation,
        weatherData,
        source: "langchain_rag",
        timestamp: new Date().toISOString(),
      })
    } catch (ragError) {
      console.error("LangChain RAG system error:", ragError)

      // Fallback to knowledge search if RAG fails
      try {
        console.log("RAG failed, attempting knowledge search fallback...")

        const knowledgeResults = await ragChain.searchKnowledge(query, {
          language,
          userLocation,
        })

        if (knowledgeResults.length > 0) {
          // Use the most relevant knowledge piece
          const bestMatch = knowledgeResults[0]
          let fallbackResponse = bestMatch.pageContent

          // Add location and weather context if available
          if (userLocation && weatherData) {
            const contextPrefix =
              language === "hi"
                ? `${userLocation} के लिए कृषि सलाह (मौसम: ${weatherData.temperature}°C, ${weatherData.condition}):\n\n`
                : language === "te"
                  ? `${userLocation} కోసం వ్యవసాయ సలహా (వాతావరణం: ${weatherData.temperature}°C, ${weatherData.condition}):\n\n`
                  : `Agricultural advice for ${userLocation} (Weather: ${weatherData.temperature}°C, ${weatherData.condition}):\n\n`

            fallbackResponse = contextPrefix + fallbackResponse
          }

          return NextResponse.json({
            results: [
              {
                id: Date.now().toString(),
                title: userLocation ? `Knowledge for ${userLocation}` : "Agricultural Knowledge",
                content: fallbackResponse,
                category: "knowledge_search",
                subcategory: "vector_search",
                language: language,
                tags: ["knowledge", "vector", "search"],
                similarity: 0.9,
                source: "knowledge_fallback",
                weatherData: weatherData,
              },
            ],
            query,
            language,
            userLocation,
            weatherData,
            source: "knowledge_fallback",
            note: "AI generation failed - using vector search results",
            timestamp: new Date().toISOString(),
          })
        }

        throw new Error("No knowledge found")
      } catch (knowledgeError) {
        console.error("Knowledge search also failed:", knowledgeError)

        // Final static fallback
        const staticResponse = getStaticFallback(query, userLocation, weatherData, language)

        return NextResponse.json({
          results: [
            {
              id: Date.now().toString(),
              title: "Agricultural Guidance",
              content: staticResponse,
              category: "static_fallback",
              subcategory: "emergency_response",
              language: language,
              tags: ["static", "fallback", "guidance"],
              similarity: 0.7,
              source: "static_fallback",
              weatherData: weatherData,
            },
          ],
          query,
          language,
          userLocation,
          weatherData,
          source: "static_fallback",
          note: "All AI services unavailable - providing basic guidance",
          timestamp: new Date().toISOString(),
        })
      }
    }
  } catch (error) {
    console.error("Search API critical error:", error)

    const errorResponse = {
      error: "Service temporarily unavailable",
      fallback: "Please consult your local agricultural extension office for immediate assistance",
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorResponse, { status: 503 })
  }
}

// Static fallback method with proper emoji formatting
function getStaticFallback(query: string, location: string | null, weather: any, language: string): string {
  const lowerQuery = query.toLowerCase()
  const locationText = location ? `${location}` : "your area"
  const weatherCondition = weather ? `${weather.temperature}°C, ${weather.condition}` : "current conditions"

  // Rice cultivation advice with proper formatting
  if (lowerQuery.includes("rice") || lowerQuery.includes("धान") || lowerQuery.includes("వరి") || lowerQuery.includes("ধান") || lowerQuery.includes("அரிசி")) {
    if (language === "hi") {
      return `🌤️ वर्तमान स्थितियां: ${locationText} में मौसम ${weatherCondition} - धान की खेती के लिए उपयुक्त

🌾 तत्काल सिफारिशें: • जून-जुलाई में बुआई करें • खेत में 2-5 सेमी पानी बनाए रखें

📋 विस्तृत सलाह: • अच्छी किस्म के बीज का चयन करें • नाइट्रोजन, फास्फोरस, पोटाश का संतुलित उपयोग • उर्वरक की मात्रा: 120:60:40 किग्रा/हेक्टेयर

⚠️ सावधानियां: • कीट-रोग की नियमित निगरानी करें • पानी की गुणवत्ता बनाए रखें

📅 समय: • सुबह 6-8 बजे खेती के काम करें • शाम 4-6 बजे सिंचाई करें`
    } else if (language === "te") {
      return `🌤️ ప్రస్తుత పరిస్థితులు: ${locationText}లో వాతావరణం ${weatherCondition} - వరి సాగుకు అనుకూలం

🌾 తక్షణ సిఫార్సులు: • జూన్-జూలైలో విత్తనాలు నాటండి • పొలంలో 2-5 సెంటీమీటర్లు నీరు ఉంచండి

📋 వివరణాత్మక సలహా: • మంచి రకం విత్తనాలు ఎంచుకోండి • నత్రజని, భాస్వరం, పొటాష్ సమతుల్యంగా వాడండి • ఎరువుల మొత్తం: 120:60:40 కిలోలు/హెక్టారు

⚠️ జాగ్రత్తలు: • కీటకాలు, వ్యాధుల పర్యవేక్షణ చేయండి • నీటి నాణ్యత కాపాడండి

📅 సమయం: • ఉదయం 6-8 గంటలకు వ్యవసాయ పనులు • సాయంత్రం 4-6 గంటలకు నీరందించండి`
    } else if (language === "bn") {
      return `🌤️ বর্তমান পরিস্থিতি: ${locationText}এ আবহাওয়া ${weatherCondition} - ধান চাষের জন্য উপযুক্ত

🌾 তাৎক্ষণিক সুপারিশ: • জুন-জুলাইয়ে বপন করুন • জমিতে ২-৫ সেমি পানি রাখুন

📋 বিস্তারিত পরামর্শ: • ভালো জাতের বীজ নির্বাচন করুন • নাইট্রোজেন, ফসফরাস, পটাশ সুষম ব্যবহার • সারের পরিমাণ: ১২০:৬০:৪০ কেজি/হেক্টর

⚠️ সতর্কতা: • পোকামাকড় ও রোগের নিয়মিত পর্যবেক্ষণ • পানির গুণমান বজায় রাখুন

📅 সময়: • সকাল ৬-৮টায় কৃষিকাজ • সন্ধ্যা ৪-৬টায় সেচ দিন`
    } else if (language === "ta") {
      return `🌤️ தற்போதைய நிலைமைகள்: ${locationText}இல் வானிலை ${weatherCondition} - நெல் சாகுபடிக்கு ஏற்றது

🌾 உடனடி பரிந்துரைகள்: • ஜூன்-ஜூலையில் விதைக்கவும் • வயலில் 2-5 செமீ தண்ணீர் வைக்கவும்

📋 விரிவான ஆலோசனை: • நல்ல ரக விதைகள் தேர்வு செய்யவும் • நைட்ரஜன், பாஸ்பரஸ், பொட்டாஷ் சமச்சீர் பயன்பாடு • உரம் அளவு: 120:60:40 கிலோ/ஹெக்டேர்

⚠️ முன்னெச்சரிக்கைகள்: • பூச்சி நோய்களை வழக்கமாக கண்காணிக்கவும் • நீரின் தரத்தை பராமரிக்கவும்

📅 நேரம்: • காலை 6-8 மணிக்கு வேளாண்மை பணிகள் • மாலை 4-6 மணிக்கு நீர்ப்பாசனம்`
    } else {
      return `🌤️ CURRENT CONDITIONS: Weather in ${locationText} is ${weatherCondition} - suitable for rice cultivation

🌾 IMMEDIATE RECOMMENDATIONS: • Plant during June-July monsoon • Maintain 2-5cm water level in fields

📋 DETAILED ADVICE: • Use quality seed varieties like IR64, MTU1010 • Apply balanced NPK fertilizers • Fertilizer ratio: 120:60:40 kg/hectare

⚠️ PRECAUTIONS: • Monitor for pests like stem borer and brown plant hopper • Maintain water quality to prevent disease

📅 TIMING: • Conduct field operations between 6-8 AM • Schedule irrigation during 4-6 PM`
    }
  }

  // General farming advice with proper formatting
  if (language === "hi") {
    return `🌤️ वर्तमान स्थितियां: ${locationText} में मौसम ${weatherCondition} - कृषि गतिविधियों के लिए उपयुक्त

🌾 तत्काल सिफारिशें: • मिट्टी परीक्षण कराएं • मौसम के अनुसार फसल का चयन करें

📋 विस्तृत सलाह: • जैविक खाद का उपयोग करें • उचित सिंचाई व्यवस्था बनाए रखें • फसल चक्र अपनाएं

⚠️ सावधानियां: • कीट-रोग की नियमित निगरानी करें • मौसम पूर्वानुमान देखें

📅 समय: • स्थानीय कृषि अधिकारी से सलाह लें • कृषि विज्ञान केंद्र से संपर्क करें`
  } else if (language === "te") {
    return `🌤️ ప్రస్తుత పరిస్థితులు: ${locationText}లో వాతావరణం ${weatherCondition} - వ్యవసాయ కార్యకలాపాలకు అనुకూలం

🌾 తక్షణ సిఫార్సులు: • మట్టి పరీక్ష చేయించుకోండి • వాతావరణం ప్రకారం పంట ఎంచుకోండి

📋 వివరణాత్మక సలహా: • సేంద్రీయ ఎరువులు వాడండి • సరైన నీటిపారుదల వ్యవస్థ • పంట మార్పిడి పద్ధతి అనుసరించండి

⚠️ జాగ్రత్తలు: • కీటకాలు, వ్యాధుల పర్యవేక్షణ చేయండి • వాతావరణ సమాచారం తెలుసుకోండి

📅 సమయం: • స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి • కృషి విజ్ఞాన కేంద్రంతో సంబంధం పెట్టుకోండి`
  } else if (language === "bn") {
    return `🌤️ বর্তমান পরিস্থিতি: ${locationText}এ আবহাওয়া ${weatherCondition} - কৃষি কাজের জন্য উপযুক্ত

🌾 তাৎক্ষণিক সুপারিশ: • মাটি পরীক্ষা করান • আবহাওয়া অনুযায়ী ফসল নির্বাচন করুন

📋 বিস্তারিত পরামর্শ: • জৈব সার ব্যবহার করুন • সঠিক সেচ ব্যবস্থা বজায় রাখুন • ফসল আবর্তন অনুসরণ করুন

⚠️ সতর্কতা: • পোকামাকড় ও রোগের নিয়মিত পর্যবেক্ষণ • আবহাওয়ার পূর্বাভাস দেখুন

📅 সময়: • স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন • কৃষি বিজ্ঞান কেন্দ্রে যোগাযোগ করুন`
  } else if (language === "ta") {
    return `🌤️ தற்போதைய நிலைமைகள்: ${locationText}இல் வானிலை ${weatherCondition} - விவசாய நடவடிக்கைகளுக்கு ஏற்றது

🌾 உடனடி பரிந்துரைகள்: • மண் பரிசோதனை செய்யவும் • வானிலை அடிப்படையில் பயிர் தேர்வு

📋 விரிவான ஆலோசனை: • இயற்கை உரங்கள் பயன்படுத்தவும் • சரியான நீர்ப்பாசன முறை • பயிர் மாற்று முறை கடைபிடிக்கவும்

⚠️ முன்னெச்சரிக்கைகள்: • பூச்சி நோய்களை வழக்கமாக கண்காணிக்கவும் • வானிலை முன்னறிவிப்பு பார்க்கவும்

📅 நேரம்: • உள்ளூர் விவசாய அலுவலரை அணுகவும் • வேளாண் அறிவியல் மையத்துடன் தொடர்பு கொள்ளவும்`
  } else {
    return `🌤️ CURRENT CONDITIONS: Weather in ${locationText} is ${weatherCondition} - suitable for farming activities

🌾 IMMEDIATE RECOMMENDATIONS: • Conduct soil testing • Choose crops based on weather patterns

📋 DETAILED ADVICE: • Use organic fertilizers for soil health • Maintain proper irrigation system • Follow crop rotation practices for sustainability

⚠️ PRECAUTIONS: • Monitor crops regularly for pests and diseases • Check weather forecasts before field operations

📅 TIMING: • Consult local agricultural extension officers • Visit nearest Krishi Vigyan Kendra for guidance`
  }
}

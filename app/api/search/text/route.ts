import { type NextRequest, NextResponse } from "next/server"
import { KrishiRAGChain } from "@/lib/langchain/rag-chain"
import { WeatherService } from "@/lib/weather/service"

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

      const aiResponse = await ragChain.generateResponse(query, {
        userLocation,
        language,
        weatherData,
      })

      console.log("LangChain RAG response generated successfully")

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

// Static fallback method
function getStaticFallback(query: string, location: string | null, weather: any, language: string): string {
  const lowerQuery = query.toLowerCase()
  const locationText = location ? ` in ${location}` : ""
  const weatherText = weather ? ` Current: ${weather.temperature}°C, ${weather.condition}.` : ""

  // Rice cultivation
  if (lowerQuery.includes("rice") || lowerQuery.includes("धान") || lowerQuery.includes("వరి")) {
    if (language === "hi") {
      return `धान की खेती${locationText}:${weatherText} जून-जुलाई में बुआई करें। खेत में 2-5 सेमी पानी रखें। अच्छी किस्म के बीज चुनें। नाइट्रोजन, फास्फोरस, पोटाश का संतुलित उपयोग करें।`
    } else if (language === "te") {
      return `వరి సాగు${locationText}:${weatherText} జూన్-జూలైలో విత్తనాలు నాటండి. పొలంలో 2-5 సెంటీమీటర్లు నీరు ఉంచండి. మంచి రకం విత్తనాలు ఎంచుకోండి. నత్రజని, భాస్వరం, పొటాష్ సమతుల్యంగా వాడండి.`
    } else {
      return `Rice cultivation${locationText}:${weatherText} Plant during June-July monsoon. Maintain 2-5cm water level in fields. Use quality seeds. Apply balanced NPK fertilizers. Monitor for pests regularly.`
    }
  }

  // General farming advice
  if (language === "hi") {
    return `कृषि मार्गदर्शन${locationText}:${weatherText} मिट्टी परीक्षण कराएं। मौसम के अनुसार फसल चुनें। जैविक खाद का उपयोग करें। कीट-रोग की निगरानी करें। स्थानीय कृषि अधिकारी से सलाह लें।`
  } else if (language === "te") {
    return `వ్యవసాయ మార్గదర్శకత్వం${locationText}:${weatherText} మట్టి పరీక్ష చేయించుకోండి. వాతావరణం ప్రకారం పంట ఎంచుకోండి. సేంద్రీయ ఎరువులు వాడండి. కీటకాలు, వ్యాధుల పర్యవేక్షణ చేయండి. స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి.`
  } else {
    return `Agricultural guidance${locationText}:${weatherText} Test your soil regularly. Choose crops based on weather patterns. Use organic fertilizers. Monitor pests and diseases. Consult local agricultural extension officers for specific advice.`
  }
}

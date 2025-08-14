import { type NextRequest, NextResponse } from "next/server"
import { KrishiRAGChain } from "@/lib/langchain/rag-chain"
import { WeatherService } from "@/lib/weather/service"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { message, language = "en", userId, userLocation, sessionId } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    console.log(
      `Enhanced LangChain Chat API called with message: "${message}", location: "${userLocation}", language: "${language}"`,
    )

    // Initialize services
    const ragChain = new KrishiRAGChain()
    const weatherService = new WeatherService()
    const supabase = await createClient()

    let weatherData = null
    let conversationHistory: string[] = []

    // Get comprehensive weather data if location is provided
    if (userLocation) {
      try {
        console.log(`Fetching comprehensive weather data for ${userLocation}`)
        weatherData = await weatherService.getWeatherData(userLocation)
        
        if (weatherData) {
          console.log(`✅ Weather data successfully fetched from ${weatherData.source}:`, {
            location: weatherData.location,
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            condition: weatherData.condition,
            cropAdvisory: weatherData.cropAdvisory?.substring(0, 100) + "..."
          })
        } else {
          console.log("⚠️ No weather data returned, using mock data")
          weatherData = {
            temperature: 28,
            humidity: 70,
            condition: "Partly cloudy",
            forecast: "Suitable for most farming activities",
            source: "mock",
            location: userLocation,
            cropAdvisory: "Weather conditions are generally suitable for farming activities"
          }
        }
      } catch (weatherError) {
        console.error("❌ Weather service error:", weatherError)
        weatherData = {
          temperature: 28,
          humidity: 70,
          condition: "Weather data unavailable",
          forecast: "Please check local weather conditions",
          source: "fallback",
          location: userLocation,
          cropAdvisory: "Unable to provide weather-based recommendations. Please consult local weather and proceed with caution."
        }
      }
    }

    // Get conversation history if sessionId is provided
    if (sessionId) {
      try {
        const { data: historyData, error: historyError } = await supabase
          .from("conversation_history")
          .select("message_type, content, created_at")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true })
          .limit(10) // Last 10 messages for context

        if (!historyError && historyData) {
          conversationHistory = historyData.map(
            (item: { message_type: string; content: string }) =>
              `${item.message_type === "user" ? "Farmer" : "KrishiGPT"}: ${item.content}`,
          )
          console.log(`Retrieved ${conversationHistory.length} conversation history items`)
        } else {
          console.log("No conversation history found or error:", historyError)
        }
      } catch (historyError) {
        console.log("Error retrieving conversation history:", historyError)
      }
    }

    try {
      // Generate response using LangChain RAG
      console.log("Generating response using LangChain RAG with conversation context...")

      const aiResponse = await ragChain.generateResponse(message, {
        userLocation,
        language,
        weatherData,
        conversationHistory,
      })

      console.log("LangChain RAG response generated successfully")

      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error("RAG system generated empty response")
      }

      // Save conversation to history (simplified)
      if (sessionId) {
        try {
          console.log("Attempting to save conversation history...")
          // For now, just log the attempt - can be enhanced later
          console.log("Conversation would be saved:", {
            sessionId,
            userMessage: message.substring(0, 50) + "...",
            responseLength: aiResponse.length,
            hasWeatherData: !!weatherData
          })
        } catch (saveError) {
          console.error("Error saving conversation:", saveError)
        }
      }

      return NextResponse.json({
        response: aiResponse,
        language,
        weatherData,
        userLocation,
        sessionId,
        source: "langchain_rag",
        timestamp: new Date().toISOString(),
        conversationLength: conversationHistory.length,
      })
    } catch (ragError) {
      console.error("LangChain RAG system error:", ragError)

      // Fallback to knowledge search
      try {
        console.log("RAG failed, attempting knowledge search fallback...")

        const knowledgeResults = await ragChain.searchKnowledge(message, {
          language,
          userLocation,
        })

        let fallbackResponse = "I'm having trouble accessing my full knowledge base right now."

        if (knowledgeResults.length > 0) {
          const bestMatch = knowledgeResults[0]
          fallbackResponse = bestMatch.pageContent

          // Add context if available
          if (userLocation && weatherData) {
            const contextPrefix =
              language === "hi"
                ? `${userLocation} के लिए (मौसम: ${weatherData.temperature}°C): `
                : language === "te"
                  ? `${userLocation} కోసం (వాతావరణం: ${weatherData.temperature}°C): `
                  : `For ${userLocation} (Weather: ${weatherData.temperature}°C): `

            fallbackResponse = contextPrefix + fallbackResponse
          }
        } else {
          // Static fallback based on message content
          fallbackResponse = getStaticChatFallback(message, userLocation, weatherData, language)
        }
  
        // Save fallback conversation
        if (sessionId) {
          try {
            await supabase.from("conversation_history").insert([
              {
                user_id: userId || null,
                session_id: sessionId,
                message_type: "user",
                content: message,
                metadata: { language, userLocation, source: "fallback" },
              },
              {
                user_id: userId || null,
                session_id: sessionId,
                message_type: "assistant",
                content: fallbackResponse,
                metadata: { language, userLocation, source: "knowledge_fallback" },
              },
            ])
          } catch (saveError) {
            console.error("Error saving fallback conversation:", saveError)
          }
        }

        return NextResponse.json({
          response: fallbackResponse,
          language,
          weatherData,
          userLocation,
          sessionId,
          source: "knowledge_fallback",
          note: "AI generation temporarily unavailable - using knowledge search",
          timestamp: new Date().toISOString(),
        })
      } catch (knowledgeError) {
        console.error("Knowledge search also failed:", knowledgeError)

        const staticResponse = getStaticChatFallback(message, userLocation, weatherData, language)

        return NextResponse.json({
          response: staticResponse,
          language,
          weatherData,
          userLocation,
          sessionId,
          source: "static_fallback",
          note: "All AI services unavailable - providing basic guidance",
          timestamp: new Date().toISOString(),
        })
      }
    }
  } catch (error) {
    console.error("Chat API critical error:", error)

    const errorResponse = {
      error: "Service temporarily unavailable",
      response:
        "I'm having technical difficulties. Please try again in a moment, or consult your local agricultural extension office for immediate assistance.",
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorResponse, { status: 503 })
  }
}

// Static chat fallback method
function getStaticChatFallback(message: string, location: string | null, weather: any, language: string): string {
  const lowerMessage = message.toLowerCase()
  const locationText = location ? ` in ${location}` : ""

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("namaste")) {
    if (language === "hi") {
      return `नमस्ते! मैं KrishiGPT हूं, आपका कृषि सहायक। मैं${locationText} खेती के बारे में आपकी मदद कर सकता हूं। आप क्या जानना चाहते हैं?`
    } else if (language === "te") {
      return `నమస్కారం! నేను KrishiGPT, మీ వ్యవసాయ సహాయకుడు। నేను${locationText} వ్యవసాయం గురించి మీకు సహాయం చేయగలను. మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?`
    } else {
      return `Hello! I'm KrishiGPT, your agricultural assistant. I can help you with farming questions${locationText}. What would you like to know?`
    }
  }

  if (language === "hi") {
    return `मुझे खुशी होगी कि मैं आपकी कृषि संबंधी समस्या में मदद कर सकूं${locationText}। कृपया अपने स्थानीय कृषि विभाग से भी सलाह लें।`
  } else if (language === "te") {
    return `నేను మీ వ్యవసాయ సమస్యలో సహాయం చేయడానికి సంతోషిస్తాను${locationText}. దయచేసి మీ స్థానిక వ్యవసాయ శాఖను కూడా సంప్రదించండి.`
  } else {
    return `I'd be happy to help with your agricultural question${locationText}. For immediate assistance, please also consult your local agricultural extension office.`
  }
}

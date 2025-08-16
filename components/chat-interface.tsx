"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Mic, MicOff, Volume2, VolumeX, User, Bot, Loader2, MapPin, Cloud } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import LocationSelector from "./location-selector"

interface ChatMessage {
  id: string
  message: string
  response: string
  language: string
  timestamp: Date
  userLocation?: string
  weatherData?: {
    temperature: number
    humidity: number
    rainfall: number
    windSpeed: number
    condition: string
    forecast: string
  }
  relevantKnowledge?: Array<{
    title: string
    category: string
    similarity: number
  }>
}

interface ChatInterfaceProps {
  initialLanguage?: string
}

// Function to format chat response text for better readability
const formatResponseText = (text: string): string => {
  return text
    // First clean up the text structure
    .replace(/🌤️\s*CURRENT CONDITIONS:/gi, '\n## 🌤️ Current Weather Conditions\n\n')
    .replace(/🌾\s*IMMEDIATE RECOMMENDATIONS:/gi, '\n## 🌾 Immediate Recommendations\n\n')
    .replace(/📋\s*DETAILED ADVICE:/gi, '\n## 📋 Detailed Growing Guide\n\n')
    .replace(/⚠️\s*PRECAUTIONS:/gi, '\n## ⚠️ Important Precautions\n\n')
    .replace(/📅\s*TIMING:/gi, '\n## 📅 Best Timing\n\n')
    .replace(/Additional Tips:/gi, '\n## 💡 Additional Tips\n\n')
    
    // Format numbered lists properly
    .replace(/(\d+)\.\s\*\*(.*?)\*\*:\s*/g, '\n### $1. $2\n\n')
    .replace(/(\d+)\.\s\*\*(.*?)\*\*:/g, '\n### $1. $2\n\n')
    .replace(/(\d+)\.\s([^*])/g, '\n**$1.** $2')
    
    // Convert bullet points to proper markdown
    .replace(/^\*\s+/gm, '- ')
    .replace(/\n\*\s+/g, '\n- ')
    
    // Fix bold formatting
    .replace(/\*\*(.*?)\*\*/g, '**$1**')
    
    // Add proper spacing around sections
    .replace(/([.!?])\s+([🌤️🌾📋⚠️📅💡])/g, '$1\n\n$2')
    .replace(/([.!?])\s+(##\s)/g, '$1\n\n$2')
    
    // Clean up multiple spaces and line breaks
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    
    // Ensure proper line breaks before lists
    .replace(/([.!?])\s*(\n- )/g, '$1\n$2')
    .replace(/([.!?])\s*(\n\*\*\d+\.)/g, '$1\n$2')
    
    .trim()
}

// Enhanced function to format weather-related content
const formatWeatherText = (text: string): string => {
  return text
    // Add proper markdown formatting for weather data
    .replace(/Temperature[:\s]*(\d+)°C/gi, '🌡️ **Temperature:** $1°C')
    .replace(/Humidity[:\s]*(\d+)%/gi, '💧 **Humidity:** $1%')
    .replace(/Rainfall[:\s]*([^,\n.]+)/gi, '🌧️ **Rainfall:** $1')
    .replace(/Wind speed[:\s]*([^,\n.]+)/gi, '💨 **Wind Speed:** $1')
    .replace(/Pressure[:\s]*([^,\n.]+)/gi, '📊 **Pressure:** $1')
    .replace(/Condition[:\s]*([^,\n.]+)/gi, '☁️ **Condition:** $1')
}

export function ChatInterface({ initialLanguage = "en" }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState(initialLanguage)
  const [isListening, setIsListening] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userLocation, setUserLocation] = useState<string>("")
  const [showLocationSelector, setShowLocationSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    const messageId = Date.now().toString()
    const userMessage = currentMessage
    setCurrentMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          language,
          userId: user?.id,
          userLocation: userLocation || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const isLocationRequest =
        data.response.toLowerCase().includes("village") ||
        data.response.toLowerCase().includes("location") ||
        data.response.toLowerCase().includes("गांव") ||
        data.response.toLowerCase().includes("स्थान") ||
        data.response.toLowerCase().includes("గ్రామం") ||
        data.response.toLowerCase().includes("స్థానం") ||
        data.response.toLowerCase().includes("which village") ||
        data.response.toLowerCase().includes("your location") ||
        data.response.toLowerCase().includes("where are you from") ||
        data.response.toLowerCase().includes("किस गांव") ||
        data.response.toLowerCase().includes("आपका स्थान") ||
        data.response.toLowerCase().includes("ఏ గ్రామం") ||
        data.response.toLowerCase().includes("మీ స్థానం")

      const newMessage: ChatMessage = {
        id: messageId,
        message: userMessage,
        response: data.response,
        language,
        timestamp: new Date(),
        userLocation: data.userLocation,
        weatherData: data.weatherData,
        relevantKnowledge: data.relevantKnowledge,
      }

      setMessages((prev) => [...prev, newMessage])

      if (isLocationRequest && !userLocation) {
        setShowLocationSelector(true)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: ChatMessage = {
        id: messageId,
        message: userMessage,
        response: "Sorry, I encountered an error. Please try again.",
        language,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in your browser")
      return
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang =
      language === "hi"
        ? "hi-IN"
        : language === "bn"
          ? "bn-IN"
          : language === "te"
            ? "te-IN"
            : language === "ta"
              ? "ta-IN"
              : "en-IN"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setCurrentMessage(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleTextToSpeech = (text: string, messageId: string) => {
    if ("speechSynthesis" in window) {
      if (speakingMessageId === messageId) {
        window.speechSynthesis.cancel()
        setSpeakingMessageId(null)
        return
      }

      if (speakingMessageId) {
        window.speechSynthesis.cancel()
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang =
        language === "hi"
          ? "hi-IN"
          : language === "bn"
            ? "bn-IN"
            : language === "te"
              ? "te-IN"
              : language === "ta"
                ? "ta-IN"
                : "en-IN"

      utterance.onstart = () => setSpeakingMessageId(messageId)
      utterance.onend = () => setSpeakingMessageId(null)
      utterance.onerror = () => setSpeakingMessageId(null)

      window.speechSynthesis.speak(utterance)
    }
  }

  const handleLocationSelect = (location: { state: string; city: string }) => {
    const locationString = `${location.city}, ${location.state}`
    setUserLocation(locationString)
    setShowLocationSelector(false)

    const locationMessage =
      language === "hi"
        ? `मैं ${locationString} से हूं।`
        : language === "te"
          ? `నేను ${locationString} నుండి వచ్చాను.`
          : `I am from ${locationString}.`

    setCurrentMessage(locationMessage)
    setTimeout(() => handleSendMessage(), 100)
  }

  const getLanguageName = (lang: string) => {
    const names = {
      en: "English",
      hi: "हिंदी",
      bn: "বাংলা",
      ta: "தமிழ்",
      te: "తెలుగు",
    }
    return names[lang as keyof typeof names] || "English"
  }

  const getWelcomeMessage = () => {
    const messages = {
      en: "Welcome to KrishiGPT! I'm here to help you with all your farming questions. Ask me about crops, pests, weather, soil health, or any agricultural practices.",
      hi: "KrishiGPT में आपका स्वागत है! मैं आपके सभी कृषि प्रश्नों में आपकी सहायता के लिए यहाँ हूँ। मुझसे फसलों, कीटों, मौसम, मिट्टी की सेहत या किसी भी कृषि पद्धति के बारे में पूछें।",
      bn: "KrishiGPT তে স্বাগতম! আমি আপনার সমস্ত কৃষি প্রশ্নে সাহায্য করতে এখানে আছি। ফসল, কীটপতঙ্গ, আবহাওয়া, মাটির স্বাস্থ্য বা যেকোনো কৃষি পদ্ধতি সম্পর্কে আমাকে জিজ্ঞাসা করুন।",
      ta: "KrishiGPT இல் வருக! உங்கள் அனைத்து விவசாய கேள்விகளிலும் உதவ நான் இங்கே இருக்கிறேன். பயிர்கள், பூச்சிகள், வானிலை, மண் ஆரோக்யம் அல்லது எந்த விவசாய நடைமுறைகள் பற்றியும் என்னிடம் கேளுங்கள்।",
      te: "KrishiGPT కి స్వాగతం! మీ అన్ని వ్యవసాయ ప్రశ్నలలో సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను. పంటలు, కీటకాలు, వాతావరణం, మట్టి ఆరోగ్యం లేదా ఏదైనా వ్యవసాయ పద్ధతుల గురించి నన్ను అడగండి.",
    }
    return messages[language as keyof typeof messages] || messages.en
  }

  const getPlaceholder = () => {
    const placeholders = {
      en: "Ask about crops, pests, weather, or farming techniques...",
      hi: "फसलों, कीटों, मौसम या खेती की तकनीकों के बारे में पूछें...",
      bn: "ফসল, কীটপতঙ্গ, আবহাওয়া বা কৃষি কৌশল সম্পর্কে জিজ্ঞাসা করুন...",
      ta: "பயிர்கள், பூச்சிகள், வானிலை அல்லது விவசாய நுட்பங்கள் பற்றி கேளுங்கள்...",
      te: "పంటలు, కీటకాలు, వాతావరణం లేదా వ్యవసాయ పద్ధతుల గురించి అడగండి...",
    }
    return placeholders[language as keyof typeof placeholders] || placeholders.en
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-cyan-800 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-cyan-800">KrishiGPT</h2>
            <p className="text-sm text-gray-500">Your AI farming assistant</p>
          </div>
        </div>
        <div className="flex gap-2">
          {["en", "hi", "bn", "ta", "te"].map((lang) => (
            <Button
              key={lang}
              variant={language === lang ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage(lang)}
              className={language === lang ? "bg-cyan-800 hover:bg-cyan-900" : ""}
            >
              {getLanguageName(lang)}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold text-cyan-800 mb-2">Welcome to KrishiGPT!</h3>
            <p className="text-gray-600 max-w-md mx-auto text-sm leading-relaxed">{getWelcomeMessage()}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-gray-200"
                onClick={() => setCurrentMessage("How to grow rice in rainy weather?")}
              >
                {language === "hi" 
                  ? "बारिश में धान" 
                  : language === "bn" 
                    ? "বৃষ্টিতে ধান" 
                    : language === "te" 
                      ? "వర్షంలో వరి" 
                      : language === "ta"
                        ? "மழையில் நெல்"
                        : "Rice in rain"}
              </Badge>
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-gray-200"
                onClick={() => setCurrentMessage("What's the best time to plant tomatoes?")}
              >
                {language === "hi" 
                  ? "टमाटर का समय" 
                  : language === "bn" 
                    ? "টমেটোর সময়" 
                    : language === "te" 
                      ? "టమాటో సమయం" 
                      : language === "ta"
                        ? "தக்காளி நேரம்"
                        : "Tomato timing"}
              </Badge>
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-gray-200"
                onClick={() => setCurrentMessage("How to improve soil fertility?")}
              >
                {language === "hi" 
                  ? "मिट्टी की उर्वरता" 
                  : language === "bn" 
                    ? "মাটির উর্বরতা" 
                    : language === "te" 
                      ? "మట్టి సారవంతత" 
                      : language === "ta"
                        ? "மண் வளம்"
                        : "Soil fertility"}
              </Badge>
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-gray-200"
                onClick={() => setCurrentMessage("Pest control for cotton crops")}
              >
                {language === "hi" 
                  ? "कपास में कीट" 
                  : language === "bn" 
                    ? "তুলায় পোকা" 
                    : language === "te" 
                      ? "పత్తిలో కీటకాలు" 
                      : language === "ta"
                        ? "பருத்தியில் பூச்சி"
                        : "Cotton pests"}
              </Badge>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-4">
            <div className="flex justify-end">
              <div className="flex items-start space-x-2 max-w-[80%]">
                <Card className="bg-cyan-800 text-white">
                  <CardContent className="p-3">
                    <p className="text-sm">{msg.message}</p>
                    {msg.userLocation && (
                      <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
                        <MapPin className="w-3 h-3" />
                        <span>{msg.userLocation}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-[80%]">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="space-y-2">
                  {msg.weatherData && (
                    <Card className="bg-blue-50 border border-blue-200">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Cloud className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            {language === "hi"
                              ? "मौसम की जानकारी"
                              : language === "bn"
                                ? "আবহাওয়ার তথ্য"
                                : language === "te"
                                  ? "వాతావరణ సమాచారం"
                                  : language === "ta"
                                    ? "வானிலை தகவல்"
                                    : "Weather Information"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                          <div>🌡️ {msg.weatherData.temperature}°C</div>
                          <div>💧 {msg.weatherData.humidity}%</div>
                          <div>🌧️ {msg.weatherData.rainfall}mm</div>
                          <div>💨 {msg.weatherData.windSpeed} km/h</div>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">{msg.weatherData.condition}</p>
                        <p className="text-xs text-blue-600 font-medium">{msg.weatherData.forecast}</p>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 max-w-none chat-response">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Custom component styling for better readability
                              p: ({ children }) => (
                                <p className="mb-4 text-sm leading-relaxed text-gray-800 last:mb-0">{children}</p>
                              ),
                              h1: ({ children }) => (
                                <h1 className="text-lg font-bold text-green-800 mb-4 mt-6 border-b-2 border-green-200 pb-2 first:mt-0">{children}</h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-base font-bold text-green-700 mb-3 mt-5 border-l-4 border-green-300 pl-3 bg-green-50 py-2 rounded-r first:mt-0">{children}</h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-sm font-semibold text-green-600 mb-2 mt-4 flex items-center gap-1">{children}</h3>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-green-800">{children}</strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-green-700">{children}</em>
                              ),
                              ul: ({ children }) => (
                                <ul className="ml-4 mb-4 space-y-2">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="ml-4 mb-4 space-y-2">{children}</ol>
                              ),
                              li: ({ children }) => (
                                <li className="text-sm text-gray-800 leading-relaxed flex items-start gap-2">
                                  <span className="text-green-600 mt-1">🌱</span>
                                  <span className="flex-1">{children}</span>
                                </li>
                              ),
                              code: ({ children }) => (
                                <code className="bg-green-50 px-2 py-1 rounded text-xs font-mono text-green-800 border border-green-200">{children}</code>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-green-300 pl-4 ml-2 mb-4 text-gray-700 italic bg-green-50 py-3 rounded-r">{children}</blockquote>
                              ),
                            }}
                          >
                            {formatWeatherText(formatResponseText(msg.response))}
                          </ReactMarkdown>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTextToSpeech(msg.response, msg.id)}
                          className="flex-shrink-0 mt-1"
                        >
                          {speakingMessageId === msg.id ? (
                            <VolumeX className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {msg.relevantKnowledge && msg.relevantKnowledge.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-gray-500">
                        {language === "hi" 
                          ? "स्रोत:" 
                          : language === "bn" 
                            ? "উৎস:" 
                            : language === "te" 
                              ? "మూలాలు:" 
                              : language === "ta"
                                ? "ஆதாரம்:"
                                : "Sources:"}
                      </span>
                      {msg.relevantKnowledge.map((knowledge, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {knowledge.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[80%]">
              <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-cyan-600" />
              </div>
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
                    <span className="text-sm text-gray-600">
                      {language === "hi"
                        ? "KrishiGPT सोच रहा है..."
                        : language === "bn"
                          ? "KrishiGPT ভাবছে..."
                          : language === "te"
                            ? "KrishiGPT ఆలోచిస్తోంది..."
                            : language === "ta"
                              ? "KrishiGPT யோசிக்கிறது..."
                              : "KrishiGPT is thinking..."}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {showLocationSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <LocationSelector onLocationSelect={handleLocationSelect} onClose={() => setShowLocationSelector(false)} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-white p-4">
        <div className="flex gap-2">
          <Input
            value={currentMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentMessage(e.target.value)}
            placeholder={getPlaceholder()}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isLoading}
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={handleVoiceInput} disabled={isLoading} title="Voice input">
            {isListening ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !currentMessage.trim()}
            className="bg-cyan-800 hover:bg-cyan-900"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

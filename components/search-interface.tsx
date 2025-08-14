"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Camera, Search, X, Loader2, Volume2, MapPin, Cloud } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { AgriculturalKnowledge } from "@/lib/supabase/client"
import LocationSelector from "./location-selector"

interface SearchResult extends AgriculturalKnowledge {
  similarity?: number
  weatherData?: {
    temperature: number
    humidity: number
    rainfall: number
    windSpeed: number
    condition: string
    forecast: string
  }
}

export function SearchInterface() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [language, setLanguage] = useState("en")
  const [userLocation, setUserLocation] = useState<string>("")
  const [showLocationSelector, setShowLocationSelector] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const initializeSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
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

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setSearchQuery(transcript)
        setIsListening(false)
        handleSearch(transcript)
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [language])

  const handleVoiceSearch = () => {
    if (!recognitionRef.current) {
      initializeSpeechRecognition()
    }

    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop()
      } else {
        recognitionRef.current.start()
      }
    } else {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.")
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageSearch = async () => {
    if (!selectedImage) {
      fileInputRef.current?.click()
      return
    }

    setIsSearching(true)
    try {
      const formData = new FormData()
      formData.append("image", selectedImage)
      formData.append("language", language)

      const response = await fetch("/api/search/image", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
        setSearchQuery(data.description || "Image analysis")
      } else {
        console.error("Image search failed")
      }
    } catch (error) {
      console.error("Error during image search:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = async (query?: string, locationOverride?: string) => {
    const searchTerm = query || searchQuery
    const currentLocation = locationOverride || userLocation
    if (!searchTerm.trim()) return

    setIsSearching(true)
    try {
      console.log("Searching with:", { query: searchTerm, userLocation: currentLocation, language })

      const response = await fetch("/api/search/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchTerm,
          language,
          userLocation: currentLocation || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Search response:", data)
        setSearchResults(data.results || [])

        if (data.results && data.results.length > 0) {
          const aiResponse = data.results[0].content
          console.log("AI Response:", aiResponse)

          const isLocationRequest =
            !currentLocation &&
            (aiResponse.toLowerCase().includes("village") ||
              aiResponse.toLowerCase().includes("location") ||
              aiResponse.toLowerCase().includes("गांव") ||
              aiResponse.toLowerCase().includes("स्थान") ||
              aiResponse.toLowerCase().includes("గ్రామం") ||
              aiResponse.toLowerCase().includes("స్థానం") ||
              aiResponse.toLowerCase().includes("which village") ||
              aiResponse.toLowerCase().includes("your location") ||
              aiResponse.toLowerCase().includes("where are you from") ||
              aiResponse.toLowerCase().includes("किस गांव") ||
              aiResponse.toLowerCase().includes("आपका स्थान") ||
              aiResponse.toLowerCase().includes("ఏ గ్రామం") ||
              aiResponse.toLowerCase().includes("మీ స్థానం"))

          console.log("Is location request:", isLocationRequest, "Current location:", currentLocation)

          if (isLocationRequest && !showLocationSelector) {
            setShowLocationSelector(true)
          }
        }

        if (data.results && data.results.length > 0) {
          await supabase.from("search_queries").insert({
            query: searchTerm,
            query_type: "text",
            language,
            results_count: data.results?.length || 0,
          })
        }
      }
    } catch (error) {
      console.error("Error during search:", error)
      setSearchResults([
        {
          id: "error",
          title: "Connection Error",
          content:
            language === "hi"
              ? "कनेक्शन में समस्या है। कृपया फिर से कोशिश करें।"
              : language === "te"
                ? "కనెక్షన్ సమస్య ఉంది. దయచేసి మళ్లీ ప్రయత్నించండి."
                : "Connection issue. Please try again.",
          category: "error",
          language,
          tags: ["error"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
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
      speechSynthesis.speak(utterance)
    }
  }

  useEffect(() => {
    initializeSpeechRecognition()
  }, [initializeSpeechRecognition])

  const handleLocationSelect = (location: { state: string; city: string }) => {
    const locationString = `${location.city}, ${location.state}`
    console.log("Location selected:", locationString)
    setUserLocation(locationString)
    setShowLocationSelector(false)

    setSearchResults([])
    setIsSearching(true)

    setTimeout(() => {
      console.log("Re-searching with location:", locationString)
      handleSearch(searchQuery, locationString)
    }, 100)
  }

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { code: "en", name: "English" },
            { code: "hi", name: "हिंदी" },
            { code: "bn", name: "বাংলা" },
            { code: "ta", name: "தமிழ்" },
            { code: "te", name: "తెలుగు" },
          ].map((lang) => (
            <Button
              key={lang.code}
              variant={language === lang.code ? "default" : "outline"}
              size="sm"
              onClick={() => handleLanguageChange(lang.code)}
              className="text-xs"
            >
              {lang.name}
            </Button>
          ))}
        </div>
      </div>

      {userLocation && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>Location: {userLocation}</span>
          <Button variant="ghost" size="sm" onClick={() => setShowLocationSelector(true)} className="text-xs">
            Change
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <Search className="w-5 h-5 text-gray-400 ml-2" />
          <Input
            type="text"
            placeholder={
              language === "hi"
                ? "फसल, कीट, मौसम या खेती की तकनीकों के बारे में पूछें..."
                : language === "bn"
                  ? "ফসল, কীটপতঙ্গ, আবহাওয়া বা কৃষি কৌশল সম্পর্কে জিজ্ঞাসা করুন..."
                  : language === "ta"
                    ? "பொறுத்து வேதியான மாதாவிகளை, பொருட்களை, வாதாவேதியான முறைகளை அல்லது கிட்டத்து முறைகளை கேட்கவும்..."
                    : language === "te"
                      ? "వాతావరణ సమాచారం"
                      : "Ask about crops, pests, weather, or farming techniques..."
            }
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="flex-1 border-none bg-transparent focus:ring-0 text-base px-4"
            disabled={isSearching}
          />

          <div className="flex items-center space-x-2 mr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleVoiceSearch}
              disabled={isSearching}
              className={`p-2 hover:bg-gray-100 rounded-full ${isListening ? "bg-red-100 text-red-600" : ""}`}
            >
              <Mic className={`w-5 h-5 ${isListening ? "animate-pulse" : "text-gray-500"}`} />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleImageSearch}
              disabled={isSearching}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Camera className="w-5 h-5 text-gray-500" />
            </Button>

            <Button
              type="submit"
              disabled={isSearching || (!searchQuery.trim() && !selectedImage)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

        {imagePreview && (
          <div className="mt-4 relative inline-block">
            <img
              src={imagePreview || "/placeholder.svg"}
              alt="Selected for analysis"
              className="w-32 h-32 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={clearImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </form>

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-cyan-800 mb-4">
            {language === "hi"
              ? "खोज परिणाम"
              : language === "bn"
                ? "অনুসন্ধানের ফলাফল"
                : language === "ta"
                  ? "தேடல் பொருட்கள்"
                  : language === "te"
                    ? "అన్వేషణ ఫలితాలు"
                    : "Search Results"}
          </h2>

          {searchResults.map((result) => (
            <Card key={result.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                {result.weatherData && (
                  <Card className="bg-blue-50 border border-blue-200 mb-4">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Cloud className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {language === "hi"
                            ? "मौसम की जानकारी"
                            : language === "te"
                              ? "వాతావరణ సమాచారం"
                              : "Weather Information"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                        <div>🌡️ {result.weatherData.temperature}°C</div>
                        <div>💧 {result.weatherData.humidity}%</div>
                        <div>🌧️ {result.weatherData.rainfall}mm</div>
                        <div>💨 {result.weatherData.windSpeed} km/h</div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">{result.weatherData.condition}</p>
                      <p className="text-xs text-blue-600 font-medium">{result.weatherData.forecast}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-cyan-800 mb-2">{result.title}</h3>
                  <Button variant="ghost" size="sm" onClick={() => speakText(result.content)} className="p-1">
                    <Volume2 className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed">{result.content}</p>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {result.category}
                  </Badge>
                  {result.subcategory && (
                    <Badge variant="outline" className="text-xs">
                      {result.subcategory}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {result.language.toUpperCase()}
                  </Badge>
                </div>

                {result.tags && result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.tags.map((tag, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchResults.length === 0 && searchQuery && !isSearching && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {language === "hi"
              ? "कोई परिणाम नहीं मिला। कृपया अपनी खोज को संशोधित करें।"
              : language === "bn"
                ? "কোনো ফলাফল পাওয়া যায়নি। অনুগ্রহ করে আপনার অনুসন্ধান সংশোধন করুন।"
                : language === "ta"
                  ? "தேடல் பொருட்கள் கிடைக்கவில்லை. அனுதலை மேம்லுக்கு மாற்றவும்."
                  : language === "te"
                    ? "కోనో ఫలితాలు లేదు. అనుగ్రহపడి మళ్ళీ ప్రయత్నించండి."
                    : "No results found. Please try refining your search."}
          </p>
        </div>
      )}

      {isSearching && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-500">
            {language === "hi"
              ? "खोज रहे हैं..."
              : language === "bn"
                ? "অনুসন্ধান করা হচ্ছে..."
                : language === "ta"
                  ? "தேடல் பொருட்கள் கிடைக்கவில்லை..."
                  : language === "te"
                    ? "వాతావరణ సమాచారం"
                    : "Searching..."}
          </p>
        </div>
      )}

      {showLocationSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <LocationSelector onLocationSelect={handleLocationSelect} onClose={() => setShowLocationSelector(false)} />
        </div>
      )}
    </div>
  )
}

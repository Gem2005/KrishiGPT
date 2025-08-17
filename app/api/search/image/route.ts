import { type NextRequest, NextResponse } from "next/server"
import { IntegratedDiseaseRAGService } from "@/lib/model/integrated-disease-rag"
import { WeatherService } from "@/lib/weather/service"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const textQuery = (formData.get("textQuery") as string) || ""
    const language = (formData.get("language") as string) || "en"
    const userLocation = (formData.get("userLocation") as string) || null

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    console.log(
      `Image Analysis API called with language: "${language}", location: "${userLocation}", text query: "${textQuery}"`
    )

    // Initialize services
    const integratedService = new IntegratedDiseaseRAGService()
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
      // Convert image to buffer
      const imageBuffer = Buffer.from(await image.arrayBuffer())

      // Analyze image with integrated ML + RAG system
      console.log("Starting integrated image analysis...")
      const analysisResult = await integratedService.analyzeImageWithRAG({
        imageBuffer,
        textQuery,
        language,
        userLocation: userLocation || undefined,
        weatherData
      })

      console.log("Image analysis completed successfully")

      // Format response for the frontend
      const formattedResponse = formatAnalysisForFrontend(analysisResult, weatherData)

      return NextResponse.json({
        results: [formattedResponse],
        query: textQuery || "Image analysis",
        language,
        userLocation,
        weatherData,
        source: "ml_model_with_rag",
        analysisDetails: {
          diseaseDetected: analysisResult.diseaseDetection.prediction,
          confidence: analysisResult.diseaseDetection.confidence,
          plantType: analysisResult.diseaseDetection.diseaseInfo?.plant,
          isHealthy: analysisResult.diseaseDetection.diseaseInfo?.isHealthy
        },
        timestamp: new Date().toISOString(),
      })

    } catch (analysisError) {
      console.error("Integrated analysis failed:", analysisError)

      // Fallback to basic response
      const fallbackTitle = language === "hi" 
        ? "छवि विश्लेषण में समस्या"
        : language === "te"
        ? "చిత్ర విశ్లేషణలో సమస్య"
        : language === "bn"
        ? "ছবি বিশ্লেষণে সমস্যা"
        : language === "ta"
        ? "படம் பகுப்பாய்வில் சிக்கல்"
        : "Image Analysis Issue"

      const fallbackContent = language === "hi"
        ? "छवि का विश्लेषण करने में असमर्थ। कृपया साफ छवि के साथ पुनः प्रयास करें या स्थानीय कृषि विशेषज्ञ से सलाह लें।"
        : language === "te"
        ? "చిత్రాన్ని విశ్లేషించలేకపోయాము. దయచేసి స్పష్టమైన చిత్రంతో మళ్లీ ప్రయత్నించండి లేదా స్థానిక వ్యవసాయ నిపుణుడిని సంప్రదించండి."
        : language === "bn"
        ? "ছবি বিশ্লেষণ করতে অক্ষম। দয়া করে একটি পরিষ্কার ছবি দিয়ে আবার চেষ্টা করুন বা স্থানীয় কৃষি বিশেষজ্ঞের পরামর্শ নিন।"
        : language === "ta"
        ? "படத்தை பகுப்பாய்வு செய்ய முடியவில்লை. தயவுசெய்து தெளிவான படத்துடன் மீண்டும் முயற்சிக்கவும் அல்லது உள்ளூர் விவசாய நிபுணரை அணுகவும்."
        : "Unable to analyze the image. Please try again with a clearer image or consult a local agricultural expert."

      return NextResponse.json({
        results: [
          {
            id: Date.now().toString(),
            title: fallbackTitle,
            content: fallbackContent,
            category: "image_analysis_error",
            subcategory: "fallback_response",
            language: language,
            tags: ["image", "error", "fallback"],
            similarity: 0.5,
            source: "error_fallback",
            weatherData: weatherData,
          },
        ],
        query: textQuery || "Image analysis",
        language,
        userLocation,
        weatherData,
        source: "error_fallback",
        note: "Image analysis failed - providing fallback guidance",
        timestamp: new Date().toISOString(),
      })
    }

  } catch (error) {
    console.error("Image search API critical error:", error)

    const errorResponse = {
      error: "Image analysis service temporarily unavailable",
      fallback: "Please consult your local agricultural extension office for plant disease identification",
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorResponse, { status: 503 })
  }
}

// Helper function to format analysis result for frontend
function formatAnalysisForFrontend(analysisResult: any, weatherData: any) {
  const { diseaseDetection, detailedAdvice, preventiveMeasures, treatmentPlan, futureCarePlans } = analysisResult

  // Combine all advice into a comprehensive response
  const comprehensiveContent = `
${detailedAdvice}

🛡️ PREVENTIVE MEASURES:
${preventiveMeasures}

💊 TREATMENT PLAN:
${treatmentPlan}

📅 FUTURE CARE:
${futureCarePlans}
  `.trim()

  const title = diseaseDetection.diseaseInfo?.isHealthy
    ? `Healthy ${diseaseDetection.diseaseInfo.plant} - Maintenance Guide`
    : `${diseaseDetection.diseaseInfo?.disease} in ${diseaseDetection.diseaseInfo?.plant} - Treatment Guide`

  return {
    id: Date.now().toString(),
    title: title,
    content: comprehensiveContent,
    category: "disease_analysis",
    subcategory: diseaseDetection.diseaseInfo?.isHealthy ? "healthy_plant" : "disease_treatment",
    language: analysisResult.language,
    tags: [
      "disease-detection", 
      "ml-model", 
      "rag-system", 
      diseaseDetection.diseaseInfo?.plant?.toLowerCase(),
      diseaseDetection.diseaseInfo?.isHealthy ? "healthy" : "disease"
    ],
    similarity: diseaseDetection.confidence || 0.8,
    source: "ml_model_with_rag",
    weatherData: weatherData,
    diseaseInfo: diseaseDetection.diseaseInfo,
    modelPrediction: diseaseDetection.prediction,
    confidence: diseaseDetection.confidence
  }
}

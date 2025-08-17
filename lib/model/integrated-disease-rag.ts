import { KrishiRAGChain } from '../langchain/rag-chain'
import { DiseaseClassifier, DiseaseDetectionResult } from './disease-classifier'

export interface ImageAnalysisRequest {
  imageBuffer: Buffer
  textQuery?: string
  language?: string
  userLocation?: string
  weatherData?: any
}

export interface ImageAnalysisResponse {
  diseaseDetection: DiseaseDetectionResult
  detailedAdvice: string
  preventiveMeasures: string
  treatmentPlan: string
  futureCarePlans: string
  language: string
  source: 'ml_model_with_rag'
}

export class IntegratedDiseaseRAGService {
  private ragChain: KrishiRAGChain
  private diseaseClassifier: DiseaseClassifier

  constructor() {
    this.ragChain = new KrishiRAGChain()
    this.diseaseClassifier = new DiseaseClassifier()
  }

  async analyzeImageWithRAG(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    const { imageBuffer, textQuery = '', language = 'en', userLocation, weatherData } = request
    let diseaseDetection: DiseaseDetectionResult | null = null

    try {
      // Step 1: Classify the disease using ML model
      console.log('Step 1: Running disease classification...')
      diseaseDetection = await this.diseaseClassifier.classifyImage(imageBuffer)
      
      if (!diseaseDetection.diseaseInfo) {
        throw new Error('Failed to analyze the image')
      }

      // Step 2: Prepare comprehensive query for RAG system
      const ragQuery = this.constructRAGQuery(diseaseDetection, textQuery, language)
      console.log('Step 2: Constructed RAG query:', ragQuery)

      // Step 3: Get detailed advice using RAG system
      console.log('Step 3: Generating detailed advice using RAG...')
      const detailedAdvice = await this.ragChain.generateResponse(ragQuery, {
        userLocation,
        language,
        weatherData,
        conversationHistory: [
          `Disease detected: ${diseaseDetection.prediction}`,
          `Plant: ${diseaseDetection.diseaseInfo.plant}`,
          `Condition: ${diseaseDetection.diseaseInfo.disease}`,
          `User query: ${textQuery}`
        ]
      })

      // Step 4: Generate specific treatment and prevention advice
      const preventiveMeasures = await this.generatePreventiveMeasures(diseaseDetection, language, userLocation)
      const treatmentPlan = await this.generateTreatmentPlan(diseaseDetection, language, userLocation, weatherData)
      const futureCarePlans = await this.generateFutureCarePlans(diseaseDetection, language, userLocation)

      return {
        diseaseDetection,
        detailedAdvice,
        preventiveMeasures,
        treatmentPlan,
        futureCarePlans,
        language,
        source: 'ml_model_with_rag'
      }

    } catch (error) {
      console.error('Integrated analysis failed:', error)
      
      // Fallback to basic disease information
      const basicAdvice = await this.diseaseClassifier.getDiseaseDetails(
        diseaseDetection?.prediction || 'Unknown condition',
        language
      )

      return {
        diseaseDetection: diseaseDetection || {
          prediction: 'Analysis failed',
          diseaseInfo: {
            plant: 'Unknown',
            disease: 'Could not identify',
            isHealthy: false
          }
        },
        detailedAdvice: basicAdvice,
        preventiveMeasures: 'Consult local agricultural extension officer',
        treatmentPlan: 'Professional diagnosis recommended',
        futureCarePlans: 'Regular monitoring advised',
        language,
        source: 'ml_model_with_rag'
      }
    }
  }

  private constructRAGQuery(detection: DiseaseDetectionResult, userQuery: string, language: string): string {
    const { diseaseInfo } = detection
    
    if (!diseaseInfo) {
      return userQuery || 'General plant care advice needed'
    }

    const baseQuery = diseaseInfo.isHealthy 
      ? `Healthy ${diseaseInfo.plant} care and maintenance`
      : `${diseaseInfo.disease} treatment in ${diseaseInfo.plant}`

    // Combine with user's text query if provided
    if (userQuery.trim()) {
      return `${baseQuery}. Additional context: ${userQuery}`
    }

    // Add specific aspects for comprehensive advice
    const detailedQuery = diseaseInfo.isHealthy
      ? `Preventive care for healthy ${diseaseInfo.plant}: optimal growing conditions, nutrition, watering schedule, pest prevention, seasonal care`
      : `Comprehensive treatment for ${diseaseInfo.disease} in ${diseaseInfo.plant}: immediate treatment, organic remedies, chemical treatment options, prevention of spread, recovery timeline, future prevention`

    return detailedQuery
  }

  private async generatePreventiveMeasures(detection: DiseaseDetectionResult, language: string, location?: string): Promise<string> {
    const { diseaseInfo } = detection
    
    if (!diseaseInfo) {
      return 'Unable to provide specific preventive measures'
    }

    const preventionQuery = diseaseInfo.isHealthy
      ? `How to prevent diseases in healthy ${diseaseInfo.plant}? Preventive care, early detection signs, optimal growing conditions`
      : `How to prevent ${diseaseInfo.disease} from recurring in ${diseaseInfo.plant}? Prevention strategies, resistant varieties, cultural practices`

    try {
      return await this.ragChain.generateResponse(preventionQuery, {
        userLocation: location,
        language,
        conversationHistory: [`Generating prevention advice for ${diseaseInfo.plant} - ${diseaseInfo.disease}`]
      })
    } catch (error) {
      return this.getFallbackPreventionAdvice(diseaseInfo, language)
    }
  }

  private async generateTreatmentPlan(detection: DiseaseDetectionResult, language: string, location?: string, weatherData?: any): Promise<string> {
    const { diseaseInfo } = detection
    
    if (!diseaseInfo || diseaseInfo.isHealthy) {
      return 'No treatment required - plant is healthy'
    }

    const treatmentQuery = `Step-by-step treatment plan for ${diseaseInfo.disease} in ${diseaseInfo.plant}: immediate actions, organic treatments, chemical options, dosage, application timing, monitoring`

    try {
      return await this.ragChain.generateResponse(treatmentQuery, {
        userLocation: location,
        language,
        weatherData,
        conversationHistory: [`Developing treatment plan for ${diseaseInfo.disease} in ${diseaseInfo.plant}`]
      })
    } catch (error) {
      return this.getFallbackTreatmentAdvice(diseaseInfo, language)
    }
  }

  private async generateFutureCarePlans(detection: DiseaseDetectionResult, language: string, location?: string): Promise<string> {
    const { diseaseInfo } = detection
    
    if (!diseaseInfo) {
      return 'Regular monitoring and care recommended'
    }

    const careQuery = diseaseInfo.isHealthy
      ? `Long-term care plan for healthy ${diseaseInfo.plant}: seasonal calendar, nutrition schedule, pruning, pest monitoring`
      : `Recovery and future care for ${diseaseInfo.plant} after ${diseaseInfo.disease}: monitoring recovery, preventing recurrence, improving plant health`

    try {
      return await this.ragChain.generateResponse(careQuery, {
        userLocation: location,
        language,
        conversationHistory: [`Planning future care for ${diseaseInfo.plant} affected by ${diseaseInfo.disease}`]
      })
    } catch (error) {
      return this.getFallbackCareAdvice(diseaseInfo, language)
    }
  }

  private getFallbackPreventionAdvice(diseaseInfo: NonNullable<DiseaseDetectionResult['diseaseInfo']>, language: string): string {
    const advice = {
      en: `For ${diseaseInfo.plant}: Maintain proper spacing, ensure good air circulation, avoid overhead watering, use disease-resistant varieties, and monitor regularly.`,
      hi: `${diseaseInfo.plant} के लिए: उचित दूरी बनाए रखें, अच्छी हवा का संचार सुनिश्चित करें, ऊपर से पानी देने से बचें, रोग प्रतिरोधी किस्मों का उपयोग करें।`,
      te: `${diseaseInfo.plant} కోసం: సరైన అంతరం ఉంచండి, మంచి గాలి ప్రసరణ నిర్ధారించండి, పైనుండి నీరు పోయడం మానండి, వ్యాధి నిరోధక రకాలను వాడండి।`,
      bn: `${diseaseInfo.plant} এর জন্য: সঠিক দূরত্ব বজায় রাখুন, ভাল বায়ু চলাচল নিশ্চিত করুন, উপর থেকে পানি দেওয়া এড়িয়ে চলুন, রোগ প্রতিরোধী জাত ব্যবহার করুন।`,
      ta: `${diseaseInfo.plant} க்கு: சரியான இடைவெளி பராமரிக்கவும், நல்ல காற்று வழி உறுதி செய்யவும், மேலே இருந்து நீர் பாய்ச்சுவதைத் தவிர்க்கவும், நோய் எதிர்ப்பு வகைகளை பயன்படுத்தவும்.`
    }
    return advice[language as keyof typeof advice] || advice.en
  }

  private getFallbackTreatmentAdvice(diseaseInfo: NonNullable<DiseaseDetectionResult['diseaseInfo']>, language: string): string {
    const advice = {
      en: `For ${diseaseInfo.disease} in ${diseaseInfo.plant}: Remove affected parts, improve drainage, apply appropriate fungicide/bactericide, increase air circulation.`,
      hi: `${diseaseInfo.plant} में ${diseaseInfo.disease} के लिए: प्रभावित भागों को हटाएं, जल निकासी में सुधार करें, उचित फफूंदीनाशक लगाएं।`,
      te: `${diseaseInfo.plant}లో ${diseaseInfo.disease} కోసం: ప్రభావిత భాగాలను తొలగించండి, నీటి నిష్కాసన మెరుగుపరచండి, తగిన శిలీంధ్రనాశిని వర్తించండి।`,
      bn: `${diseaseInfo.plant}এ ${diseaseInfo.disease} এর জন্য: আক্রান্ত অংশ অপসারণ করুন, নিষ্কাশন উন্নত করুন, উপযুক্ত ছত্রাকনাশক প্রয়োগ করুন।`,
      ta: `${diseaseInfo.plant}இல் ${diseaseInfo.disease} க்கு: பாதிக்கப்பட்ட பகுதிகளை அகற்றவும், வடிகால் மேம்படுத்தவும், பொருத்தமான பூஞ்சைக் கொல்லி பயன்படுத்தவும்.`
    }
    return advice[language as keyof typeof advice] || advice.en
  }

  private getFallbackCareAdvice(diseaseInfo: NonNullable<DiseaseDetectionResult['diseaseInfo']>, language: string): string {
    const advice = {
      en: `Future care for ${diseaseInfo.plant}: Regular monitoring, balanced nutrition, proper watering, seasonal care adjustments, and early detection practices.`,
      hi: `${diseaseInfo.plant} की भविष्य की देखभाल: नियमित निगरानी, संतुलित पोषण, उचित पानी, मौसमी देखभाल समायोजन।`,
      te: `${diseaseInfo.plant} యొక్క భవిష్యత్ సంరక్షణ: క్రమ పర్యవేక్షణ, సమతుల్య పోషణ, సరైన నీరు, కాలానుగుణ సంరక్షణ సర్దుబాట్లు।`,
      bn: `${diseaseInfo.plant} এর ভবিষ্যৎ যত্ন: নিয়মিত পর্যবেক্ষণ, সুষম পুষ্টি, সঠিক পানি, ঋতুভিত্তিক যত্ন সমন্বয়।`,
      ta: `${diseaseInfo.plant} இன் எதிர்கால பராமரிப்பு: வழக்கமான கண்காணிப்பு, சமச்சீர் ஊட்டச்சத்து, சரியான நீர், பருவகால பராமரிப்பு மாற்றங்கள்.`
    }
    return advice[language as keyof typeof advice] || advice.en
  }
}

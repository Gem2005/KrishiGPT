import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { writeFile } from 'fs/promises'

export interface DiseaseDetectionResult {
  prediction: string
  confidence?: number
  top_predictions?: Array<{
    disease: string
    confidence: number
  }>
  diseaseInfo?: {
    plant: string
    disease: string
    isHealthy: boolean
  }
  service?: string
}

export class DiseaseClassifier {
  private modelPath: string
  private pythonScriptPath: string
  private isProduction: boolean
  private renderServiceUrl?: string

  constructor() {
    this.modelPath = path.join(process.cwd(), 'model')
    this.pythonScriptPath = path.join(this.modelPath, 'predict.py')
    this.isProduction = process.env.NODE_ENV === 'production'
    this.renderServiceUrl = process.env.RENDER_SERVICE_URL
  }

  async classifyImage(imageBuffer: Buffer): Promise<DiseaseDetectionResult> {
    // Check if we should use remote service (production + render URL available)
    if (this.isProduction && this.renderServiceUrl) {
      return this.classifyImageRemote(imageBuffer)
    }
    
    // Use local classification
    return this.classifyImageLocal(imageBuffer)
  }

  private async classifyImageRemote(imageBuffer: Buffer): Promise<DiseaseDetectionResult> {
    try {
      const formData = new FormData()
      const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' })
      formData.append('file', blob, 'image.jpg')

      const response = await fetch(`${this.renderServiceUrl}/predict`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Remote service error: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.prediction) {
        const diseaseInfo = this.parsePrediction(result.prediction.disease)
        
        return {
          prediction: result.prediction.disease,
          confidence: result.prediction.confidence,
          top_predictions: result.prediction.top_predictions,
          diseaseInfo,
          service: result.service || 'remote'
        }
      }
      
      throw new Error('Invalid response from remote service')
    } catch (error) {
      console.warn('Remote classification failed, falling back to local:', error)
      return this.classifyImageLocal(imageBuffer)
    }
  }

  private async classifyImageLocal(imageBuffer: Buffer): Promise<DiseaseDetectionResult> {
    return new Promise(async (resolve, reject) => {
      try {
        // Save the image temporarily
        const tempImagePath = path.join(this.modelPath, `temp_${Date.now()}.jpg`)
        await writeFile(tempImagePath, imageBuffer)

        // Run Python prediction using predict.py (CLI mode)
        const pythonProcess = spawn('python', [this.pythonScriptPath, tempImagePath], {
          cwd: this.modelPath
        })
        
        let output = ''
        let errorOutput = ''

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString()
        })

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString()
        })

        pythonProcess.on('close', (code) => {
          // Clean up temp file
          try {
            fs.unlinkSync(tempImagePath)
          } catch (e) {
            console.warn('Could not delete temp file:', e)
          }

          if (code !== 0) {
            reject(new Error(`Python process failed: ${errorOutput}`))
            return
          }

          try {
            const result = JSON.parse(output.trim())
            
            if (result.error) {
              reject(new Error(result.error))
              return
            }

            // Handle both old and new response formats
            let prediction: string
            let confidence: number | undefined
            let topPredictions: Array<{disease: string, confidence: number}> | undefined
            
            if (result.success && result.prediction) {
              // New format from updated main.py
              prediction = result.prediction.disease
              confidence = result.prediction.confidence
              topPredictions = result.prediction.top_predictions
            } else {
              // Old format fallback
              prediction = result.prediction
              confidence = result.confidence
            }

            const diseaseInfo = this.parsePrediction(prediction)
            
            resolve({
              prediction,
              confidence,
              top_predictions: topPredictions,
              diseaseInfo,
              service: 'local'
            })
          } catch (e) {
            reject(new Error(`Failed to parse model output: ${output}`))
          }
        })

        pythonProcess.on('error', (error) => {
          reject(new Error(`Failed to start Python process: ${error.message}`))
        })

      } catch (error) {
        reject(new Error(`Image classification failed: ${error}`))
      }
    })
  }

  private parsePrediction(prediction: string): DiseaseDetectionResult['diseaseInfo'] {
    // Parse the prediction string to extract plant and disease info
    // Format: "Plant___Disease" or "Plant___healthy"
    const parts = prediction.split('___')
    if (parts.length >= 2) {
      const plant = parts[0].replace(/_/g, ' ')
      const condition = parts[1].replace(/_/g, ' ')
      const isHealthy = condition.toLowerCase() === 'healthy'
      
      return {
        plant: plant,
        disease: isHealthy ? 'Healthy' : condition,
        isHealthy: isHealthy
      }
    }
    
    // Return a default structure instead of undefined
    return {
      plant: 'Unknown',
      disease: prediction,
      isHealthy: false
    }
  }

  // Get detailed information about a detected disease
  async getDiseaseDetails(prediction: string, language: string = 'en'): Promise<string> {
    const diseaseInfo = this.parsePrediction(prediction)
    
    if (!diseaseInfo) {
      return 'Unable to analyze the image. Please try again with a clearer image.'
    }
    
    if (diseaseInfo.isHealthy) {
      return this.getHealthyPlantAdvice(diseaseInfo.plant, language)
    }
    
    return this.getDiseaseAdvice(diseaseInfo.plant, diseaseInfo.disease, language)
  }

  private getHealthyPlantAdvice(plant: string, language: string): string {
    const advice = {
      en: `Your ${plant} appears healthy! Continue with regular care: proper watering, adequate sunlight, and balanced nutrition.`,
      hi: `आपका ${plant} स्वस्थ दिख रहा है! नियमित देखभाल जारी रखें: उचित पानी, पर्याप्त धूप, और संतुलित पोषण।`,
      te: `మీ ${plant} ఆరోగ్యంగా కనిపిస్తోంది! సాధారణ సంరక్షణ కొనసాగించండి: సరైన నీరు, తగినంత సూర్యకాంతి, మరియు సమతుల్య పోషణ।`,
      bn: `আপনার ${plant} সুস্থ দেখাচ্ছে! নিয়মিত যত্ন চালিয়ে যান: সঠিক পানি, পর্যাপ্ত সূর্যালোক, এবং সুষম পুষ্টি।`,
      ta: `உங்கள் ${plant} ஆரோக்கியமாக தெரிகிறது! வழக்கமான பராமரிப்பை தொடரவும்: சரியான நீர், போதுமான சூரிய ஒளி, மற்றும் சமச்சீர் ஊட்டச்சத்து।`
    }
    
    return advice[language as keyof typeof advice] || advice.en
  }

  private getDiseaseAdvice(plant: string, disease: string, language: string): string {
    // This will be enhanced with RAG system integration
    const advice = {
      en: `${disease} detected in ${plant}. Immediate action required for proper treatment.`,
      hi: `${plant} में ${disease} का पता चला। उचित उपचार के लिए तत्काल कार्रवाई आवश्यक।`,
      te: `${plant}లో ${disease} కనుగొనబడింది. సరైన చికిత్స కోసం తక్షణ చర్య అవసరం.`,
      bn: `${plant}এ ${disease} সনাক্ত করা হয়েছে। সঠিক চিকিৎসার জন্য তাৎক্ষণিক পদক্ষেপ প্রয়োজন।`,
      ta: `${plant}இல் ${disease} கண்டறியப்பட்டது. சரியான சிகிச்சைக்கு உடனடி நடவடிக்கை தேவை।`
    }
    
    return advice[language as keyof typeof advice] || advice.en
  }
}

import { KrishiRAGChain } from "@/lib/langchain/rag-chain"
import { embeddingService } from "@/lib/langchain/embedding-service"

export interface TestQuery {
  query: string
  language: string
  location?: string
  expectedKeywords: string[]
  category: string
}

export interface PerformanceMetrics {
  responseTime: number
  relevanceScore: number
  completeness: number
  accuracy: number
  languageConsistency: number
}

export interface TestResult {
  query: TestQuery
  response: string
  metrics: PerformanceMetrics
  success: boolean
  errors?: string[]
}

export class RAGPerformanceTester {
  private ragChain: KrishiRAGChain
  private testQueries: TestQuery[]

  constructor() {
    this.ragChain = new KrishiRAGChain()
    this.testQueries = this.generateTestQueries()
  }

  private generateTestQueries(): TestQuery[] {
    return [
      // Rice cultivation queries
      {
        query: "How to grow rice in monsoon season?",
        language: "en",
        location: "Punjab, India",
        expectedKeywords: ["rice", "monsoon", "water", "planting", "cultivation"],
        category: "crop_cultivation",
      },
      {
        query: "धान की खेती कैसे करें?",
        language: "hi",
        location: "उत्तर प्रदेश, भारत",
        expectedKeywords: ["धान", "खेती", "पानी", "बुआई"],
        category: "crop_cultivation",
      },
      {
        query: "వరి సాగు ఎలా చేయాలి?",
        language: "te",
        location: "आंध्र प्रदेश, भारत",
        expectedKeywords: ["వరి", "సాగు", "నీరు", "విత్తనాలు"],
        category: "crop_cultivation",
      },

      // Pest management queries
      {
        query: "How to control pests in wheat crop?",
        language: "en",
        location: "Haryana, India",
        expectedKeywords: ["pest", "wheat", "control", "spray", "management"],
        category: "pest_management",
      },
      {
        query: "गेहूं में कीट नियंत्रण कैसे करें?",
        language: "hi",
        location: "मध्य प्रदेश, भारत",
        expectedKeywords: ["गेहूं", "कीट", "नियंत्रण", "दवा"],
        category: "pest_management",
      },

      // Soil health queries
      {
        query: "How to improve soil fertility?",
        language: "en",
        location: "Maharashtra, India",
        expectedKeywords: ["soil", "fertility", "organic", "fertilizer", "compost"],
        category: "soil_health",
      },
      {
        query: "मिट्टी की उर्वरता कैसे बढ़ाएं?",
        language: "hi",
        location: "राजस्थान, भारत",
        expectedKeywords: ["मिट्टी", "उर्वरता", "खाद", "जैविक"],
        category: "soil_health",
      },

      // Weather-based queries
      {
        query: "What crops to grow during drought?",
        language: "en",
        location: "Rajasthan, India",
        expectedKeywords: ["drought", "crops", "water", "resistant", "bajra"],
        category: "weather_farming",
      },
      {
        query: "सूखे में कौन सी फसल उगाएं?",
        language: "hi",
        location: "राजस्थान, भारत",
        expectedKeywords: ["सूखा", "फसल", "बाजरा", "ज्वार"],
        category: "weather_farming",
      },

      // Regional specific queries
      {
        query: "Best crops for Punjab climate?",
        language: "en",
        location: "Punjab, India",
        expectedKeywords: ["Punjab", "climate", "wheat", "rice", "crops"],
        category: "regional_farming",
      },
    ]
  }

  async runPerformanceTests(): Promise<TestResult[]> {
    console.log(`Starting RAG performance tests with ${this.testQueries.length} queries...`)

    const results: TestResult[] = []

    for (const testQuery of this.testQueries) {
      console.log(`Testing query: "${testQuery.query}" (${testQuery.language})`)

      try {
        const startTime = Date.now()

        const response = await this.ragChain.generateResponse(testQuery.query, {
          userLocation: testQuery.location,
          language: testQuery.language,
        })

        const responseTime = Date.now() - startTime

        const metrics = await this.evaluateResponse(testQuery, response, responseTime)

        results.push({
          query: testQuery,
          response,
          metrics,
          success: true,
        })

        console.log(
          `✓ Query completed in ${responseTime}ms, relevance: ${metrics.relevanceScore.toFixed(2)}, accuracy: ${metrics.accuracy.toFixed(2)}`,
        )
      } catch (error) {
        console.error(`✗ Query failed:`, error)

        results.push({
          query: testQuery,
          response: "",
          metrics: {
            responseTime: 0,
            relevanceScore: 0,
            completeness: 0,
            accuracy: 0,
            languageConsistency: 0,
          },
          success: false,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        })
      }

      // Add delay between tests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return results
  }

  private async evaluateResponse(
    testQuery: TestQuery,
    response: string,
    responseTime: number,
  ): Promise<PerformanceMetrics> {
    const responseLower = response.toLowerCase()

    // Calculate relevance score based on expected keywords
    const keywordMatches = testQuery.expectedKeywords.filter((keyword) => responseLower.includes(keyword.toLowerCase()))
    const relevanceScore = keywordMatches.length / testQuery.expectedKeywords.length

    // Calculate completeness (response length and structure)
    const completeness = Math.min(response.length / 200, 1) // Expect at least 200 chars

    // Calculate accuracy (presence of specific agricultural terms)
    const agriculturalTerms = [
      "crop",
      "soil",
      "water",
      "fertilizer",
      "seed",
      "harvest",
      "plant",
      "farm",
      "agriculture",
      "cultivation",
    ]
    const termMatches = agriculturalTerms.filter((term) => responseLower.includes(term))
    const accuracy = termMatches.length / agriculturalTerms.length

    // Calculate language consistency
    let languageConsistency = 1
    if (testQuery.language === "hi") {
      // Check for Hindi characters
      const hindiPattern = /[\u0900-\u097F]/
      languageConsistency = hindiPattern.test(response) ? 1 : 0.5
    } else if (testQuery.language === "te") {
      // Check for Telugu characters
      const teluguPattern = /[\u0C00-\u0C7F]/
      languageConsistency = teluguPattern.test(response) ? 1 : 0.5
    }

    return {
      responseTime,
      relevanceScore,
      completeness,
      accuracy,
      languageConsistency,
    }
  }

  async runLoadTest(concurrentUsers = 10, queriesPerUser = 5): Promise<any> {
    console.log(`Starting load test with ${concurrentUsers} concurrent users, ${queriesPerUser} queries each...`)

    const startTime = Date.now()
    const promises: Promise<any>[] = []

    for (let user = 0; user < concurrentUsers; user++) {
      const userPromise = this.simulateUser(user, queriesPerUser)
      promises.push(userPromise)
    }

    const results = await Promise.allSettled(promises)
    const totalTime = Date.now() - startTime

    const successful = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    const loadTestResults = {
      concurrentUsers,
      queriesPerUser,
      totalQueries: concurrentUsers * queriesPerUser,
      successful,
      failed,
      totalTime,
      averageTimePerQuery: totalTime / (concurrentUsers * queriesPerUser),
      successRate: (successful / concurrentUsers) * 100,
    }

    console.log("Load test completed:", loadTestResults)
    return loadTestResults
  }

  private async simulateUser(userId: number, queryCount: number): Promise<any> {
    const userResults = []

    for (let i = 0; i < queryCount; i++) {
      const randomQuery = this.testQueries[Math.floor(Math.random() * this.testQueries.length)]

      try {
        const startTime = Date.now()
        const response = await this.ragChain.generateResponse(randomQuery.query, {
          userLocation: randomQuery.location,
          language: randomQuery.language,
        })
        const responseTime = Date.now() - startTime

        userResults.push({
          userId,
          queryIndex: i,
          success: true,
          responseTime,
          responseLength: response.length,
        })
      } catch (error) {
        userResults.push({
          userId,
          queryIndex: i,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }

      // Small delay between queries from same user
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    return userResults
  }

  async testEmbeddingPerformance(): Promise<any> {
    console.log("Testing embedding service performance...")

    const testTexts = [
      "Rice cultivation requires proper water management and soil preparation.",
      "धान की खेती के लिए उचित जल प्रबंधन और मिट्टी की तैयारी आवश्यक है।",
      "వరి సాగుకు సరైన నీటి నిర్వహణ మరియు మట్టి తయారీ అవసరం.",
      "Wheat should be sown in November-December after monsoon ends.",
      "Integrated pest management is essential for sustainable agriculture.",
    ]

    const startTime = Date.now()

    try {
      const embeddingResult = await embeddingService.embedDocuments(testTexts)
      const totalTime = Date.now() - startTime

      return {
        success: true,
        documentsProcessed: testTexts.length,
        totalTime,
        averageTimePerDocument: totalTime / testTexts.length,
        model: embeddingResult.model,
        dimensions: embeddingResult.dimensions,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        totalTime: Date.now() - startTime,
      }
    }
  }

  generatePerformanceReport(results: TestResult[]): any {
    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)

    if (successful.length === 0) {
      return {
        summary: "All tests failed",
        successRate: 0,
        failed: failed.length,
      }
    }

    const avgResponseTime = successful.reduce((sum, r) => sum + r.metrics.responseTime, 0) / successful.length
    const avgRelevance = successful.reduce((sum, r) => sum + r.metrics.relevanceScore, 0) / successful.length
    const avgAccuracy = successful.reduce((sum, r) => sum + r.metrics.accuracy, 0) / successful.length
    const avgCompleteness = successful.reduce((sum, r) => sum + r.metrics.completeness, 0) / successful.length
    const avgLanguageConsistency =
      successful.reduce((sum, r) => sum + r.metrics.languageConsistency, 0) / successful.length

    // Performance grades
    const getGrade = (score: number): string => {
      if (score >= 0.9) return "A"
      if (score >= 0.8) return "B"
      if (score >= 0.7) return "C"
      if (score >= 0.6) return "D"
      return "F"
    }

    return {
      summary: {
        totalTests: results.length,
        successful: successful.length,
        failed: failed.length,
        successRate: (successful.length / results.length) * 100,
      },
      performance: {
        averageResponseTime: Math.round(avgResponseTime),
        responseTimeGrade: avgResponseTime < 3000 ? "A" : avgResponseTime < 5000 ? "B" : "C",
      },
      quality: {
        relevanceScore: avgRelevance,
        relevanceGrade: getGrade(avgRelevance),
        accuracyScore: avgAccuracy,
        accuracyGrade: getGrade(avgAccuracy),
        completenessScore: avgCompleteness,
        completenessGrade: getGrade(avgCompleteness),
        languageConsistency: avgLanguageConsistency,
        languageGrade: getGrade(avgLanguageConsistency),
      },
      recommendations: this.generateRecommendations(avgResponseTime, avgRelevance, avgAccuracy),
      categoryBreakdown: this.analyzeCategoryPerformance(successful),
    }
  }

  private generateRecommendations(responseTime: number, relevance: number, accuracy: number): string[] {
    const recommendations: string[] = []

    if (responseTime > 5000) {
      recommendations.push("Consider optimizing embedding cache and vector search performance")
    }

    if (relevance < 0.7) {
      recommendations.push("Improve knowledge base with more specific agricultural content")
    }

    if (accuracy < 0.8) {
      recommendations.push("Enhance prompt engineering for more accurate agricultural responses")
    }

    if (recommendations.length === 0) {
      recommendations.push("RAG system is performing well - continue monitoring")
    }

    return recommendations
  }

  private analyzeCategoryPerformance(results: TestResult[]): any {
    const categories = new Map<string, TestResult[]>()

    results.forEach((result) => {
      const category = result.query.category
      if (!categories.has(category)) {
        categories.set(category, [])
      }
      categories.get(category)!.push(result)
    })

    const categoryAnalysis: any = {}

    categories.forEach((categoryResults, category) => {
      const avgRelevance =
        categoryResults.reduce((sum, r) => sum + r.metrics.relevanceScore, 0) / categoryResults.length
      const avgAccuracy = categoryResults.reduce((sum, r) => sum + r.metrics.accuracy, 0) / categoryResults.length

      categoryAnalysis[category] = {
        testCount: categoryResults.length,
        averageRelevance: avgRelevance,
        averageAccuracy: avgAccuracy,
        performance: avgRelevance > 0.8 && avgAccuracy > 0.8 ? "Good" : "Needs Improvement",
      }
    })

    return categoryAnalysis
  }
}

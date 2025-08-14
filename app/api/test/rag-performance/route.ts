import { type NextRequest, NextResponse } from "next/server"
import { RAGPerformanceTester } from "@/lib/testing/rag-performance-tester"

export async function POST(request: NextRequest) {
  try {
    const { testType = "performance", concurrentUsers = 5, queriesPerUser = 3 } = await request.json()

    console.log(`Starting RAG ${testType} test...`)

    const tester = new RAGPerformanceTester()
    let results: any

    switch (testType) {
      case "performance":
        const testResults = await tester.runPerformanceTests()
        const report = tester.generatePerformanceReport(testResults)
        results = {
          type: "performance",
          report,
          detailedResults: testResults,
        }
        break

      case "load":
        const loadResults = await tester.runLoadTest(concurrentUsers, queriesPerUser)
        results = {
          type: "load",
          results: loadResults,
        }
        break

      case "embedding":
        const embeddingResults = await tester.testEmbeddingPerformance()
        results = {
          type: "embedding",
          results: embeddingResults,
        }
        break

      default:
        return NextResponse.json({ error: "Invalid test type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    })
  } catch (error) {
    console.error("Error running RAG tests:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to run RAG tests",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

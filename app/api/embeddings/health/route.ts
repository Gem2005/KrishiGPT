import { type NextRequest, NextResponse } from "next/server"
import { embeddingService } from "@/lib/langchain/embedding-service"

export async function GET(request: NextRequest) {
  try {
    console.log("Checking embedding service health...")

    const healthStatus = await embeddingService.healthCheck()
    const availableProviders = embeddingService.getAvailableProviders()

    const overallHealth = Object.values(healthStatus).some((status) => status)

    return NextResponse.json({
      healthy: overallHealth,
      providers: healthStatus,
      availableProviders,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking embedding service health:", error)

    return NextResponse.json(
      {
        healthy: false,
        error: "Failed to check embedding service health",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

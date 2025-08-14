import { type NextRequest, NextResponse } from "next/server"
import { KnowledgeSeeder } from "@/lib/langchain/knowledge-seeder"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting knowledge seeding process...")

    const seeder = new KnowledgeSeeder()

    // Seed comprehensive agricultural knowledge
    await seeder.seedAgriculturalKnowledge()

    // Seed multilingual content
    await seeder.seedMultilingualContent()

    console.log("Knowledge seeding completed successfully")

    return NextResponse.json({
      success: true,
      message: "Agricultural knowledge base seeded successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error seeding knowledge:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed knowledge base",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

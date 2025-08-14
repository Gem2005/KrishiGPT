import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { EmbeddingService } from "@/lib/rag/embeddings"

export async function POST(request: NextRequest) {
  try {
    const { title, content, category, language = "en" } = await request.json()

    if (!title || !content || !category) {
      return NextResponse.json({ error: "Title, content, and category are required" }, { status: 400 })
    }

    const supabase = await createClient()
    const embeddingService = EmbeddingService.getInstance()

    // Generate embedding for the content
    const embedding = await embeddingService.generateEmbedding(content)

    // Insert knowledge into database
    const { data, error } = await supabase
      .from("agricultural_knowledge")
      .insert({
        title,
        content,
        category,
        language,
        embedding,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting knowledge:", error)
      return NextResponse.json({ error: "Failed to save knowledge" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Knowledge uploaded successfully",
      id: data.id,
    })
  } catch (error) {
    console.error("Error in knowledge upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

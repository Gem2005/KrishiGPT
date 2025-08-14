import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    // Check database connection
    const supabase = await createClient()
    const { data, error } = await (supabase.from("agricultural_knowledge").select("*") as any).limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          message: "Database connection failed",
          error: error.message,
        },
        { status: 500 },
      )
    }

    // Check environment variables
    const requiredEnvVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "GROQ_API_KEY",
    ]

    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: "warning",
          message: "Some environment variables are missing",
          missingEnvVars,
        },
        { status: 200 },
      )
    }

    return NextResponse.json({
      status: "healthy",
      message: "KrishiGPT is running successfully",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        ai: "configured",
        auth: "enabled",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

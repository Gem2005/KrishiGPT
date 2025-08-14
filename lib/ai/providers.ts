import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"

export interface AIProvider {
  name: string
  generateText: (prompt: string, systemPrompt?: string) => Promise<string>
  isAvailable: () => boolean
}

export class GroqProvider implements AIProvider {
  name = "Groq"

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: groq("llama-3.1-8b-instant"),
        prompt,
        system: systemPrompt,
        maxOutputTokens: 1000,
        temperature: 0.7,
      })

      if (!text || text.trim().length === 0) {
        throw new Error("Groq returned empty response")
      }

      return text.trim()
    } catch (error) {
      console.error("Groq API error:", error)
      throw new Error(`Groq service failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  isAvailable(): boolean {
    const hasKey = !!process.env.GROQ_API_KEY
    if (!hasKey) {
      console.log("Groq API key not found")
    }
    return hasKey
  }
}

export class OpenAIProvider implements AIProvider {
  name = "OpenAI"

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.startsWith("sk-abcd") || apiKey.includes("*")) {
      throw new Error("Invalid or placeholder OpenAI API key")
    }

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        system: systemPrompt,
        maxOutputTokens: 1000,
        temperature: 0.7,
      })

      if (!text || text.trim().length === 0) {
        throw new Error("OpenAI returned empty response")
      }

      return text.trim()
    } catch (error) {
      console.error("OpenAI API error:", error)
      throw new Error(`OpenAI service failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  isAvailable(): boolean {
    const apiKey = process.env.OPENAI_API_KEY
    const hasValidKey = !!apiKey && !apiKey.startsWith("sk-abcd") && !apiKey.includes("*")
    if (!hasValidKey) {
      console.log("OpenAI API key not found or invalid")
    }
    return hasValidKey
  }
}

export class GeminiProvider implements AIProvider {
  name = "Gemini"

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      throw new Error("Gemini API key not found - set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY")
    }

    try {
      const { text } = await generateText({
        model: google("gemini-1.5-flash"),
        prompt,
        system: systemPrompt,
        maxOutputTokens: 1000,
        temperature: 0.7,
      })

      if (!text || text.trim().length === 0) {
        throw new Error("Gemini returned empty response")
      }

      return text.trim()
    } catch (error) {
      console.error("Gemini API error:", error)
      throw new Error(`Gemini service failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  isAvailable(): boolean {
    const hasKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    if (!hasKey) {
      console.log("Gemini API key not found")
    }
    return hasKey
  }
}

export class AIServiceManager {
  private providers: AIProvider[] = [new GroqProvider(), new OpenAIProvider(), new GeminiProvider()]

  async generateWithFailover(
    prompt: string,
    systemPrompt?: string,
  ): Promise<{
    text: string
    provider: string
    attempts: number
  }> {
    const availableProviders = this.providers.filter((p) => p.isAvailable())

    console.log(`Available AI providers: ${availableProviders.map((p) => p.name).join(", ")}`)

    if (availableProviders.length === 0) {
      console.error("No AI providers available - check API keys")
      throw new Error("No AI providers available - please configure API keys")
    }

    let lastError: Error | null = null
    let attempts = 0

    for (const provider of availableProviders) {
      attempts++
      try {
        console.log(`Attempting AI generation with provider: ${provider.name} (attempt ${attempts})`)
        const text = await provider.generateText(prompt, systemPrompt)

        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from AI provider")
        }

        console.log(`✅ Success with provider: ${provider.name} - Generated ${text.length} characters`)
        return { text, provider: provider.name, attempts }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.error(`❌ Failed with provider ${provider.name}:`, errorMessage)
        lastError = error as Error

        if (attempts < availableProviders.length) {
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000)
          console.log(`Waiting ${delay}ms before trying next provider...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    const finalError = `All ${attempts} AI providers failed. Last error: ${lastError?.message}`
    console.error(finalError)
    throw new Error(finalError)
  }

  getAvailableProviders(): string[] {
    const available = this.providers.filter((p) => p.isAvailable()).map((p) => p.name)
    console.log(`Available providers: ${available.join(", ")}`)
    return available
  }

  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {}

    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          await provider.generateText("Test", "Respond with 'OK'")
          results[provider.name] = true
        } catch (error) {
          console.error(`Health check failed for ${provider.name}:`, error)
          results[provider.name] = false
        }
      } else {
        results[provider.name] = false
      }
    }

    return results
  }
}

export interface EmbeddingResult {
  embedding: number[]
  text: string
}

export class EmbeddingService {
  private static instance: EmbeddingService

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService()
    }
    return EmbeddingService.instance
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Using a simple TF-IDF-like approach for hackathon prototype
      // In production, you'd use a proper embedding model
      const words = text
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 2)
      const embedding = new Array(384).fill(0)

      words.forEach((word, index) => {
        const hash = this.simpleHash(word)
        embedding[hash % 384] += 1 / (index + 1)
      })

      // Normalize the embedding
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
      return embedding.map((val) => (magnitude > 0 ? val / magnitude : 0))
    } catch (error) {
      console.error("Error generating embedding:", error)
      return new Array(384).fill(0)
    }
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}

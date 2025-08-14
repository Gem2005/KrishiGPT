import { SearchInterface } from "@/components/search-interface"

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-800 mb-4">KrishiGPT Search</h1>
          <p className="text-gray-600">Search our agricultural knowledge base using text, voice, or images</p>
        </div>
        <SearchInterface />
      </div>
    </div>
  )
}

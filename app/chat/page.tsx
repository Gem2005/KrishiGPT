import { createClient } from "@/lib/supabase/server"
import { ChatInterface } from "@/components/chat-interface"
import { UserNav } from "@/components/auth/user-nav"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sprout } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirectTo=/chat")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/" className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-cyan-800 rounded-lg flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-cyan-800">KrishiGPT</span>
              </div>
            </div>
            <UserNav />
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <main className="h-[calc(100vh-4rem)]">
        <ChatInterface />
      </main>
    </div>
  )
}

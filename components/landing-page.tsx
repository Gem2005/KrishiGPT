"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Camera, Search, Sprout, Shield, CloudRain, BookOpen, Users, Globe, Zap, Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { UserNav } from "@/components/auth/user-nav"

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleVoiceSearch = () => {
    router.push("/search")
  }

  const handleImageSearch = () => {
    router.push("/search")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push("/search")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      {/* Dynamic Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-sm shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - moves to left when scrolled */}
            <div
              className={`flex items-center transition-all duration-300 ${
                isScrolled ? "justify-start" : "justify-center flex-1"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-cyan-800 rounded-lg flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-cyan-800">KrishiGPT</span>
              </div>
              {!isScrolled && (
                <p className="ml-4 text-sm text-gray-600 hidden md:block">
                  Your multilingual agricultural assistant for smarter farming decisions
                </p>
              )}
            </div>

            {/* Navigation buttons - move to right when scrolled */}
            <div
              className={`hidden md:flex items-center space-x-4 transition-all duration-300 ${
                isScrolled ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <Button variant="ghost" className="text-cyan-800 hover:text-cyan-900">
                Features
              </Button>
              <Button variant="ghost" className="text-cyan-800 hover:text-cyan-900">
                About
              </Button>
              <Button variant="ghost" className="text-cyan-800 hover:text-cyan-900">
                Contact
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => router.push("/chat")}>
                Get Started
              </Button>
              <UserNav />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <UserNav />
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Button variant="ghost" className="w-full justify-start text-cyan-800">
                  Features
                </Button>
                <Button variant="ghost" className="w-full justify-start text-cyan-800">
                  About
                </Button>
                <Button variant="ghost" className="w-full justify-start text-cyan-800">
                  Contact
                </Button>
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => router.push("/chat")}
                >
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-cyan-800 mb-6 font-sans">Empower Your Farming with AI</h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Get instant answers about crop management, pest control, weather insights, and farming techniques in your
            preferred language.
          </p>

          {/* Search Bar with Voice and Image Options */}
          <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-200 p-2">
                <Search className="w-5 h-5 text-gray-400 ml-4" />
                <Input
                  type="text"
                  placeholder="Ask about crops, pests, weather, or farming techniques..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="flex-1 border-none bg-transparent focus:ring-0 text-lg px-4"
                />
                <div className="flex items-center space-x-2 mr-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceSearch}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Mic className="w-5 h-5 text-gray-500" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleImageSearch}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Camera className="w-5 h-5 text-gray-500" />
                  </Button>
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full">
                    Search
                  </Button>
                </div>
              </div>
            </form>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge variant="secondary" className="text-xs">
                Rice cultivation
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Pest identification
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Weather forecast
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Soil health
              </Badge>
            </div>
          </div>

          {/* Language Support */}
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 mb-8">
            <Globe className="w-4 h-4" />
            <span>Available in:</span>
            <span className="font-medium">English • हिंदी • বাংলা • தமிழ் • తెలుగు</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-cyan-800 mb-4">Everything You Need for Smart Farming</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powered by advanced AI to provide accurate, localized agricultural guidance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Sprout className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-cyan-800 mb-2">Crop Management</h3>
                <p className="text-gray-600 text-sm">
                  Optimize your yields with AI-powered recommendations for planting, fertilizing, and harvesting.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-cyan-800 mb-2">Pest Control</h3>
                <p className="text-gray-600 text-sm">
                  Identify and manage pests in real-time with image recognition and treatment suggestions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CloudRain className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-cyan-800 mb-2">Weather Insights</h3>
                <p className="text-gray-600 text-sm">
                  Stay ahead with accurate forecasts and weather-based farming recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-cyan-800 mb-2">Farming Techniques</h3>
                <p className="text-gray-600 text-sm">
                  Discover best practices tailored for your crops, soil, and local conditions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-cyan-800 mb-12">Trusted by Farmers Across India</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">10,000+</div>
              <div className="text-gray-600">Agricultural Queries Answered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">5</div>
              <div className="text-gray-600">Languages Supported</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">24/7</div>
              <div className="text-gray-600">AI Assistant Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Start Your Journey Today</h2>
          <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers who are already using AI to make smarter farming decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3"
              onClick={() => router.push("/chat")}
            >
              <Zap className="w-5 h-5 mr-2" />
              Try KrishiGPT Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-cyan-800 px-8 py-3 bg-transparent"
            >
              <Users className="w-5 h-5 mr-2" />
              Join Community
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-cyan-800 rounded-lg flex items-center justify-center">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">KrishiGPT</span>
            </div>
            <div className="text-gray-400 text-sm text-center md:text-right">
              <p>Built for Capital One Hackathon 2024</p>
              <p className="mt-1">Empowering farmers with AI technology</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

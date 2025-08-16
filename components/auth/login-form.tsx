"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Phone, Facebook, Mail } from "lucide-react"
import Link from "next/link"

export function LoginForm() {
  const [mode, setMode] = useState<"email" | "phone">("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [phone, setPhone] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const router = useRouter()

  // Email/password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        router.push("/chat")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Phone OTP login
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      })
      if (error) {
        setError(error.message)
      } else {
        setOtpSent(true)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "sms",
      })
      if (error) {
        setError(error.message)
      } else {
        router.push("/chat")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // OAuth login
  const handleOAuth = async (provider: "google" | "facebook") => {
    setIsLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/chat`,
        },
      })
      if (error) setError(error.message)
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">Welcome Back</CardTitle>
        <CardDescription>Sign in to your KrishiGPT account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "email" ? "default" : "outline"}
            onClick={() => setMode("email")}
            className="flex-1"
            type="button"
          >
            <Mail className="mr-2 h-4 w-4" /> Email
          </Button>
          <Button
            variant={mode === "phone" ? "default" : "outline"}
            onClick={() => setMode("phone")}
            className="flex-1"
            type="button"
          >
            <Phone className="mr-2 h-4 w-4" /> Phone
          </Button>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Email/password login */}
        {mode === "email" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        )}

        {/* Phone login */}
        {mode === "phone" && !otpSent && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                placeholder="Enter your phone number (+91...)"
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
            </Button>
          </form>
        )}
        {mode === "phone" && otpSent && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>
          </form>
        )}

        <div className="my-4 flex items-center">
          <div className="flex-grow border-t border-gray-200" />
          <span className="mx-2 text-muted-foreground text-xs">OR</span>
          <div className="flex-grow border-t border-gray-200" />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={() => handleOAuth("google")}
            disabled={isLoading}
            type="button"
          >
            <img src="/google.svg" alt="Google" className="h-5 w-5 mr-2" />
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={() => handleOAuth("facebook")}
            disabled={isLoading}
            type="button"
          >
            <Facebook className="h-5 w-5 mr-2 text-[#1877f3]" />
            Continue with Facebook
          </Button>
        </div>

        <div className="text-center text-sm mt-4">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link href="/auth/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

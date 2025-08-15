import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  )
}
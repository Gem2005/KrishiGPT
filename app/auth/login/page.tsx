import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}

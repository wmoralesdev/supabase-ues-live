import { LoginForm } from "@/components/auth/LoginForm"

export function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <LoginForm />
    </div>
  )
}


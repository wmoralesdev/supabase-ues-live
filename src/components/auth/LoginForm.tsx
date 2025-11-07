import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Mail, Send, CheckCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .email("Por favor ingresa un correo electrónico válido"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const navigate = useNavigate()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  })

  useEffect(() => {
    // Check for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        toast.success("¡Sesión iniciada exitosamente!")
        navigate("/")
      }
    })

    // Check if user is already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate])

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) {
        toast.error(error.message || "Error al enviar enlace mágico")
        return
      }

      setEmailSent(true)
      toast.success("Enlace mágico enviado correctamente")
    } catch (error) {
      console.error("Error al enviar enlace mágico:", error)
      toast.error("Error inesperado al enviar enlace mágico")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })

      if (error) {
        toast.error(error.message || "Error al iniciar sesión con GitHub")
        setIsLoading(false)
      }
      // Note: OAuth redirect will happen automatically, so we don't set loading to false here
    } catch (error) {
      console.error("Error al iniciar sesión con GitHub:", error)
      toast.error("Error inesperado al iniciar sesión con GitHub")
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <Card className="w-full max-w-md text-base">
        <CardHeader className="space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
              <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            ¡Revisa tu correo!
          </CardTitle>
          <CardDescription className="text-center text-base">
            Te hemos enviado un enlace mágico a{" "}
            <span className="font-semibold text-foreground">
              {form.getValues("email")}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Mail className="size-5" />
            <AlertDescription className="text-base">
              Haz clic en el enlace del correo para iniciar sesión. El enlace
              expirará en 1 hora.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full text-base"
            onClick={() => setEmailSent(false)}
          >
            Usar otro correo
          </Button>
          <Button
            variant="link"
            className="text-base"
            onClick={() => {
              setIsLoading(true)
              onSubmit(form.getValues()).finally(() => setIsLoading(false))
            }}
            disabled={isLoading}
          >
            {isLoading ? "Enviando..." : "Reenviar enlace"}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md text-base">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold">Bienvenido</CardTitle>
        <CardDescription className="text-base">
          Ingresa tu correo electrónico y te enviaremos un enlace mágico para
          iniciar sesión
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Correo electrónico
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="nombre@ejemplo.com"
                        className="pl-10 text-base h-11"
                        disabled={isLoading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-base" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full text-base h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                "Enviando enlace..."
              ) : (
                <>
                  <Send className="size-5 mr-2" />
                  Enviar enlace mágico
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
            O CONTINUAR CON
          </span>
        </div>

        <Button variant="outline" className="w-full text-base h-11" disabled={isLoading} onClick={handleGitHubLogin}>
          <svg className="size-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </Button>
      </CardContent>
    </Card>
  )
}


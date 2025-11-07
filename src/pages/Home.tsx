import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { CheckCircle, XCircle, LogOut } from "lucide-react"

export function Home() {
  const navigate = useNavigate()
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setHasSession(!!session)
      setUserEmail(session?.user?.email || null)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session)
      setUserEmail(session?.user?.email || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error(error.message || "Error al cerrar sesión")
        return
      }
      toast.success("Sesión cerrada exitosamente")
      navigate("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast.error("Error inesperado al cerrar sesión")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl text-base">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">¡Bienvenido!</CardTitle>
            {hasSession !== null && (
              <Badge
                variant={hasSession ? "default" : "outline"}
                className="flex items-center gap-1.5"
              >
                {hasSession ? (
                  <>
                    <CheckCircle className="size-3" />
                    Sesión activa
                  </>
                ) : (
                  <>
                    <XCircle className="size-3" />
                    Sin sesión
                  </>
                )}
              </Badge>
            )}
          </div>
          <CardDescription className="text-base">
            {hasSession
              ? "Has iniciado sesión exitosamente"
              : "No hay una sesión activa"}
          </CardDescription>
          {hasSession && userEmail && (
            <p className="text-sm text-muted-foreground mt-2">
              Conectado como: <span className="font-medium">{userEmail}</span>
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base text-muted-foreground">
            Esta es la página principal de la aplicación.
          </p>
          <div className="flex gap-3">
            {hasSession ? (
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-base"
              >
                <LogOut className="size-4 mr-2" />
                Cerrar sesión
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="text-base"
              >
                Ir a Login
              </Button>
            )}
            <Button 
              className="text-base"
              onClick={() => navigate("/events/list")}
            >
              Ver Eventos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


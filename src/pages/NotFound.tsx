import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { Home, ArrowLeft } from "lucide-react"

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-lg text-base">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <span className="text-6xl font-bold text-muted-foreground">404</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Página no encontrada</CardTitle>
          <CardDescription className="text-base">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="text-base h-11 flex-1"
            >
              <ArrowLeft className="size-5 mr-2" />
              Volver atrás
            </Button>
            <Button
              onClick={() => navigate("/")}
              className="text-base h-11 flex-1"
            >
              <Home className="size-5 mr-2" />
              Ir al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


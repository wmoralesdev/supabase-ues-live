import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getEvents } from "@/lib/events"
import type { Event } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Calendar, MapPin, Plus, RefreshCw, FileText } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function EventsList() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchEvents = async () => {
    try {
      const { data, error } = await getEvents()

      if (error) {
        toast.error(error.message || "Error al cargar eventos")
        return
      }

      setEvents(data || [])
    } catch (error) {
      console.error("Error al cargar eventos:", error)
      toast.error("Error inesperado al cargar eventos")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchEvents()
  }

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "PPP 'a las' p", { locale: es })
    } catch {
      return dateString
    }
  }

  const isEventPast = (dateString: string) => {
    try {
      return new Date(dateString) < new Date()
    } catch {
      return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto pt-8">
          <div className="mb-6">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Eventos</h1>
            <p className="text-muted-foreground">
              {events.length === 0
                ? "No hay eventos disponibles"
                : `${events.length} ${events.length === 1 ? "evento" : "eventos"} encontrado${events.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`size-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button onClick={() => navigate("/events")}>
              <Plus className="size-4 mr-2" />
              Crear Evento
            </Button>
          </div>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay eventos</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Comienza creando tu primer evento
              </p>
              <Button onClick={() => navigate("/events")}>
                <Plus className="size-4 mr-2" />
                Crear Evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card
                key={event.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl pr-2">{event.title}</CardTitle>
                    {isEventPast(event.date) && (
                      <Badge variant="secondary" className="shrink-0">
                        Finalizado
                      </Badge>
                    )}
                  </div>
                  {event.description && (
                    <CardDescription className="line-clamp-2">
                      {event.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4 mt-0.5 shrink-0" />
                    <span>{formatEventDate(event.date)}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4 mt-0.5 shrink-0" />
                    <span>{event.location}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


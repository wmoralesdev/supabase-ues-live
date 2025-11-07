import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { createEvent } from "@/lib/events"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, MapPin, FileText } from "lucide-react"

const eventSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200, "El título es demasiado largo"),
  description: z.string().max(1000, "La descripción es demasiado larga").optional().nullable(),
  date: z.string().min(1, "La fecha es requerida"),
  location: z.string().min(1, "La ubicación es requerida").max(200, "La ubicación es demasiado larga"),
})

type EventFormValues = z.infer<typeof eventSchema>

export function CreateEvent() {
  const navigate = useNavigate()
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      location: "",
    },
  })

  const onSubmit = async (values: EventFormValues) => {
    try {
      // Convert datetime-local to ISO 8601 format
      const dateValue = new Date(values.date).toISOString()
      
      const { error } = await createEvent({
        title: values.title,
        description: values.description || null,
        date: dateValue,
        location: values.location,
      })

      if (error) {
        toast.error(error.message || "Error al crear el evento")
        return
      }

      toast.success("Evento creado exitosamente")
      navigate("/")
    } catch (error) {
      console.error("Error al crear evento:", error)
      toast.error("Error inesperado al crear el evento")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="size-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Crear Nuevo Evento</CardTitle>
            <CardDescription>
              Completa el formulario para crear un nuevo evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="size-4" />
                        Título
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Conferencia de Tecnología" {...field} />
                      </FormControl>
                      <FormDescription>
                        El título del evento (máximo 200 caracteres)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe el evento..."
                          className="min-h-24"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Descripción opcional del evento (máximo 1000 caracteres)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="size-4" />
                        Fecha y Hora
                      </FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>
                        Selecciona la fecha y hora del evento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="size-4" />
                        Ubicación
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Auditorio Principal, Ciudad" {...field} />
                      </FormControl>
                      <FormDescription>
                        La ubicación donde se realizará el evento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="flex-1"
                  >
                    {form.formState.isSubmitting ? "Creando..." : "Crear Evento"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


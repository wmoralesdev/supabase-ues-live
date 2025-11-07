import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getEventById } from "@/lib/events"
import { getMessagesByEvent, createMessage, subscribeToMessages, subscribeToPresence } from "@/lib/messages"
import type { Event, ChatMessage } from "@/types/database"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ArrowLeft, Calendar, MapPin, Send, MessageSquare, Users } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { RealtimeChannel } from "@supabase/supabase-js"

export function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [, setUserEmail] = useState<string | null>(null)
  const [onlineUsersCount, setOnlineUsersCount] = useState(0)

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setCurrentUserId(session?.user?.id || null)
      setUserEmail(session?.user?.email || null)
    }
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (!id) return

    const fetchEvent = async () => {
      try {
        const { data, error } = await getEventById(id)

        if (error) {
          toast.error(error.message || "Error al cargar el evento")
          navigate("/events/list")
          return
        }

        setEvent(data)
      } catch (error) {
        console.error("Error al cargar evento:", error)
        toast.error("Error inesperado al cargar el evento")
        navigate("/events/list")
      }
    }

    fetchEvent()
  }, [id, navigate])

  useEffect(() => {
    if (!id) return

    const fetchMessages = async () => {
      try {
        const { data, error } = await getMessagesByEvent(id)

        if (error) {
          toast.error(error.message || "Error al cargar mensajes")
          return
        }

        setMessages(data || [])
        setLoading(false)
      } catch (error) {
        console.error("Error al cargar mensajes:", error)
        toast.error("Error inesperado al cargar mensajes")
        setLoading(false)
      }
    }

    fetchMessages()
  }, [id])

  useEffect(() => {
    if (!id) return

    let messageChannel: RealtimeChannel | null = null
    let presenceChannel: RealtimeChannel | null = null

    const setupRealtime = () => {
      // Subscribe to messages
      messageChannel = subscribeToMessages(id, (newMessage) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((msg) => msg.id === newMessage.id)) {
            return prev
          }
          return [...prev, newMessage]
        })
        // Scroll to bottom when new message arrives
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
      })

      // Subscribe to presence (online users) if user is authenticated
      if (currentUserId) {
        presenceChannel = subscribeToPresence(id, currentUserId, (count) => {
          setOnlineUsersCount(count)
        })
      }
    }

    setupRealtime()

    return () => {
      if (messageChannel) {
        messageChannel.unsubscribe()
      }
      if (presenceChannel) {
        presenceChannel.unsubscribe()
      }
    }
  }, [id, currentUserId])

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageText.trim() || !currentUserId || !id) {
      if (!currentUserId) {
        toast.error("Debes iniciar sesión para enviar mensajes")
        navigate("/login")
      }
      return
    }

    setSending(true)
    try {
      const { error } = await createMessage({
        event_id: id,
        user_id: currentUserId,
        content: messageText.trim(),
      })

      if (error) {
        toast.error(error.message || "Error al enviar mensaje")
        return
      }

      setMessageText("")
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
      toast.error("Error inesperado al enviar mensaje")
    } finally {
      setSending(false)
    }
  }

  const formatMessageDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

      if (diffInSeconds < 60) {
        return "Ahora"
      }
      if (diffInSeconds < 3600) {
        return `Hace ${Math.floor(diffInSeconds / 60)} min`
      }
      if (diffInSeconds < 86400) {
        return `Hace ${Math.floor(diffInSeconds / 3600)} h`
      }

      return format(date, "PPP 'a las' p", { locale: es })
    } catch {
      return dateString
    }
  }

  const getInitials = (userId: string) => {
    // Simple hash-based color and initial generation
    const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-indigo-500",
    ]
    const color = colors[hash % colors.length]
    return { color, initial: userId.substring(0, 2).toUpperCase() }
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

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-64" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Button variant="ghost" onClick={() => navigate("/events/list")} className="mb-6">
          <ArrowLeft className="size-4 mr-2" />
          Volver a Eventos
        </Button>

        {/* Hero Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold pr-4">{event.title}</h1>
              {isEventPast(event.date) && (
                <Badge variant="secondary" className="shrink-0">
                  Finalizado
                </Badge>
              )}
            </div>

            {event.description && (
              <p className="text-muted-foreground mb-6">{event.description}</p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <Calendar className="size-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Fecha y Hora</p>
                  <p className="text-sm text-muted-foreground">{formatEventDate(event.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="size-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Ubicación</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="border-b p-4 flex items-center gap-2 flex-wrap">
                <MessageSquare className="size-5 text-muted-foreground" />
                <h2 className="font-semibold">Chat en Vivo</h2>
                <div className="flex gap-2 ml-auto">
                  {onlineUsersCount > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="size-3" />
                      {onlineUsersCount} {onlineUsersCount === 1 ? "usuario" : "usuarios"}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {messages.length} {messages.length === 1 ? "mensaje" : "mensajes"}
                  </Badge>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <MessageSquare className="size-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No hay mensajes aún. ¡Sé el primero en comentar!
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.user_id === currentUserId
                      const { color, initial } = getInitials(message.user_id)

                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                        >
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback className={color}>{initial}</AvatarFallback>
                          </Avatar>
                          <div
                            className={`flex flex-col max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isOwnMessage
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 px-1">
                              {formatMessageDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                {currentUserId ? (
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={sending || !messageText.trim()}>
                      <Send className="size-4" />
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Debes iniciar sesión para participar en el chat
                    </p>
                    <Button onClick={() => navigate("/login")} variant="outline">
                      Iniciar Sesión
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


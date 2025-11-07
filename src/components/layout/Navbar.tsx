import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Home, Calendar, PlusCircle, LogOut, LogIn, Menu, X } from "lucide-react"

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Error al cerrar sesión")
    } else {
      toast.success("Sesión cerrada exitosamente")
      navigate("/")
    }
  }

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { path: "/", label: "Inicio", icon: Home },
    { path: "/events/list", label: "Eventos", icon: Calendar },
    ...(user ? [{ path: "/events", label: "Crear Evento", icon: PlusCircle }] : []),
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-8 flex items-center space-x-2">
          <Calendar className="size-6 text-primary" />
          <Link to="/" className="font-bold text-xl">
            UES Live
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <div className="flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Button
                  key={link.path}
                  variant={isActive(link.path) ? "default" : "ghost"}
                  asChild
                >
                  <Link to={link.path}>
                    <Icon className="size-4 mr-2" />
                    {link.label}
                  </Link>
                </Button>
              )
            })}
          </div>

          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden lg:inline">
                  {user.email}
                </span>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="size-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Button variant="default" asChild>
                <Link to="/login">
                  <LogIn className="size-4 mr-2" />
                  Iniciar Sesión
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="container px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Button
                  key={link.path}
                  variant={isActive(link.path) ? "default" : "ghost"}
                  className="w-full justify-start"
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to={link.path}>
                    <Icon className="size-4 mr-2" />
                    {link.label}
                  </Link>
                </Button>
              )
            })}
            <div className="pt-4 border-t space-y-2">
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {user.email}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <LogOut className="size-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to="/login">
                    <LogIn className="size-4 mr-2" />
                    Iniciar Sesión
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}


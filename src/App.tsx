import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { Layout } from "@/components/layout/Layout"
import { Home } from "@/pages/Home"
import { Login } from "@/pages/Login"
import { NotFound } from "@/pages/NotFound"
import { CreateEvent } from "@/pages/CreateEvent"
import { EventsList } from "@/pages/EventsList"
import { EventDetail } from "@/pages/EventDetail"

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/events" element={<CreateEvent />} />
          <Route path="/events/list" element={<EventsList />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App

# Supabase Authentication Implementation Guide

## Overview

This document summarizes the complete implementation of Supabase authentication with magic link (OTP) and GitHub OAuth in a React + TypeScript application. The implementation includes login, logout, session management, and user feedback.

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Core Concepts](#core-concepts)
3. [Implementation Details](#implementation-details)
4. [Key Patterns](#key-patterns)
5. [Complete Code Examples](#complete-code-examples)

---

## Setup & Configuration

### 1. Supabase Client Setup

**File: `src/lib/supabase.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Key Points:**
- Uses environment variables for security (never hardcode credentials)
- Creates a singleton Supabase client instance
- Export it for use throughout the application

**Environment Variables Required:**
```env
VITE_APP_SUPABASE_URL=your-project-url
VITE_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Toast Notifications Setup

**File: `src/App.tsx`**

```typescript
import { Toaster } from "sonner"

function App() {
  return (
    <BrowserRouter>
      <Toaster /> {/* Add this once at app root */}
      <Routes>
        {/* ... routes ... */}
      </Routes>
    </BrowserRouter>
  )
}
```

**Key Points:**
- Add `<Toaster />` component once at the root level
- Enables toast notifications throughout the app
- Uses `sonner` library (already installed)

---

## Core Concepts

### Authentication Methods

1. **Magic Link (OTP)**: Passwordless email authentication
   - User enters email → receives magic link → clicks link → authenticated
   - Uses `signInWithOtp()`

2. **OAuth (GitHub)**: Third-party authentication
   - User clicks GitHub button → redirected to GitHub → authorized → redirected back
   - Uses `signInWithOAuth()`

### Session Management

- **Session**: Represents an authenticated user state
- **Session Check**: `supabase.auth.getSession()` - gets current session
- **Session Listener**: `supabase.auth.onAuthStateChange()` - listens for auth changes
- **Sign Out**: `supabase.auth.signOut()` - ends the session

---

## Implementation Details

### 1. Magic Link Authentication

**Location: `src/components/auth/LoginForm.tsx`**

```typescript
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
```

**Key Points:**
- `signInWithOtp()` sends a magic link email
- `emailRedirectTo` specifies where user goes after clicking link
- Always handle errors and provide user feedback
- Use loading states to prevent duplicate submissions

### 2. GitHub OAuth Authentication

**Location: `src/components/auth/LoginForm.tsx`**

```typescript
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
    // Note: OAuth redirect happens automatically, don't set loading to false here
  } catch (error) {
    console.error("Error al iniciar sesión con GitHub:", error)
    toast.error("Error inesperado al iniciar sesión con GitHub")
    setIsLoading(false)
  }
}
```

**Key Points:**
- `signInWithOtp()` redirects user to GitHub automatically
- Don't reset loading state on success (redirect happens)
- Only reset loading on error
- `redirectTo` must match your Supabase allowed redirect URLs

### 3. Auth State Listener (Auto-redirect)

**Location: `src/components/auth/LoginForm.tsx`**

```typescript
useEffect(() => {
  // Listen for auth state changes
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

  // Cleanup: unsubscribe when component unmounts
  return () => {
    subscription.unsubscribe()
  }
}, [navigate])
```

**Key Points:**
- `onAuthStateChange()` fires when auth state changes (login, logout, token refresh)
- Check `event` type: `"SIGNED_IN"`, `"SIGNED_OUT"`, `"TOKEN_REFRESHED"`, etc.
- Always check existing session on mount
- **Critical**: Unsubscribe in cleanup to prevent memory leaks

### 4. Session Indicator & User Info

**Location: `src/pages/Home.tsx`**

```typescript
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
```

**Key Points:**
- Use `getSession()` to check current session
- Access user data via `session.user.email`, `session.user.id`, etc.
- Listen for changes to update UI in real-time
- Use `null` initially to distinguish "loading" from "no session"

### 5. Logout Functionality

**Location: `src/pages/Home.tsx`**

```typescript
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
```

**Key Points:**
- `signOut()` clears the session
- Always handle errors
- Redirect user after logout
- Session listener will automatically update UI

---

## Key Patterns

### Pattern 1: Error Handling

Always follow this pattern:

```typescript
try {
  const { error } = await supabase.auth.someMethod()
  
  if (error) {
    toast.error(error.message || "Fallback error message")
    return // Exit early on error
  }
  
  // Success logic here
  toast.success("Success message")
} catch (error) {
  console.error("Unexpected error:", error)
  toast.error("Unexpected error message")
} finally {
  // Cleanup (e.g., setIsLoading(false))
}
```

### Pattern 2: Session Checking

```typescript
// Check current session
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  // User is authenticated
  const email = session.user.email
  const userId = session.user.id
}
```

### Pattern 3: Auth State Listener

```typescript
useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    // Handle different events
    if (event === "SIGNED_IN") {
      // User just logged in
    } else if (event === "SIGNED_OUT") {
      // User just logged out
    }
    
    // Update state based on session
    setHasSession(!!session)
  })

  return () => {
    subscription.unsubscribe() // CRITICAL: Always cleanup
  }
}, [])
```

---

## Complete Code Examples

### LoginForm Component (Simplified)

```typescript
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          navigate("/")
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [navigate])

  // Magic link login
  const handleMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` }
    })
    if (error) toast.error(error.message)
    else toast.success("Check your email!")
  }

  // GitHub OAuth
  const handleGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/` }
    })
    if (error) toast.error(error.message)
  }

  return (
    // Your form JSX here
  )
}
```

### Home Component with Session Management

```typescript
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export function Home() {
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setUserEmail(session?.user?.email || null)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setHasSession(!!session)
        setUserEmail(session?.user?.email || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Logged out successfully")
      navigate("/login")
    }
  }

  return (
    // Your JSX with session indicator and logout button
  )
}
```

---

## Common Issues & Solutions

### Issue 1: Redirect URL Mismatch

**Problem**: OAuth redirect fails with "redirect_uri_mismatch"

**Solution**: 
- Ensure `redirectTo` matches exactly what's configured in Supabase dashboard
- Check Supabase project settings → Authentication → URL Configuration
- For local dev: Use `http://localhost:5173/` (match your dev server port)

### Issue 2: Session Not Persisting

**Problem**: User gets logged out on page refresh

**Solution**:
- Check that `getSession()` is called on app initialization
- Verify Supabase client is using correct URL and key
- Check browser localStorage (Supabase stores tokens there)

### Issue 3: Memory Leaks

**Problem**: Multiple auth listeners causing performance issues

**Solution**:
- Always unsubscribe in `useEffect` cleanup
- Only create one listener per component
- Consider using a context provider for global auth state

### Issue 4: Magic Link Not Working

**Problem**: Email not received or link doesn't work

**Solution**:
- Check Supabase email settings (SMTP configuration)
- Verify `emailRedirectTo` URL is correct
- Check spam folder
- For local dev, check Supabase logs in dashboard

---

## Best Practices

1. **Always handle errors**: Never assume auth operations will succeed
2. **Provide user feedback**: Use toast notifications for all auth actions
3. **Clean up listeners**: Always unsubscribe from `onAuthStateChange`
4. **Check session on mount**: Verify authentication state when components load
5. **Use loading states**: Prevent duplicate submissions during async operations
6. **Secure environment variables**: Never commit `.env` files to git
7. **Validate redirect URLs**: Ensure OAuth redirects match Supabase config

---

## Next Steps

To extend this implementation:

1. **Protected Routes**: Create route guards that check authentication
2. **User Profile**: Display and edit user profile information
3. **Session Refresh**: Handle token refresh automatically
4. **Multiple OAuth Providers**: Add Google, Apple, etc.
5. **Email Verification**: Require email confirmation before access
6. **Password Reset**: Implement password reset flow
7. **Auth Context**: Create React context for global auth state

---

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-api)
- [React Router Documentation](https://reactrouter.com/)
- [Sonner Toast Library](https://sonner.emilkowal.ski/)

---

*Last updated: December 2024*


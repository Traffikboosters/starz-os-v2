import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './client'
import type { User } from '@supabase/supabase-js'
import type { Database } from './database.types'

type DbUser = Database['public']['Tables']['users']['Row']

interface AuthContextValue {
  user: User | null
  dbUser: DbUser | null
  isLoading: boolean
  isAdmin: boolean
  isSales: boolean
  isDeveloper: boolean
  isBGE: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = dbUser?.role === 'admin'
  const isSales = dbUser?.role === 'sales' || dbUser?.role === 'admin'
  const isDeveloper = dbUser?.role === 'developer'
  const isBGE = dbUser?.role === 'bge'

  const fetchDbUser = async (authUser: User) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    setDbUser(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchDbUser(session.user)
      setIsLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchDbUser(session.user)
      else setDbUser(null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) return { error: error.message }
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        name,
        role: 'sales',
        department: 'sales',
      })
    }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setDbUser(null)
  }

  const refreshUser = async () => {
    if (user) await fetchDbUser(user)
  }

  return (
    <AuthContext.Provider value={{
      user, dbUser, isLoading,
      isAdmin, isSales, isDeveloper, isBGE,
      signIn, signUp, signOut, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider')
  return ctx
}

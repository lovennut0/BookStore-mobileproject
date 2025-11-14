import React, { createContext, useState, useEffect } from 'react'
import { supabase } from '../api/supabaseClient'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signUp = async ({ username, email, password }) => {
    const { data, error: sigupError } = await supabase.auth.signUp(
        { email, password , options:{ data: { username }, }, })
    
    if (sigupError) {
      return { error: sigupError }
    }
    const user = data.user
    if (!user) {
        return { error: {message: 'Sign up failed' }}
    }
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: user.id, username: username, email: email })
    
    if (profileError) {
        return { error: profileError }
    }
    return { error: null }
  }
  
  const signIn = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
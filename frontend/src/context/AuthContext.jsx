import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Decodifica o payload do JWT sem biblioteca externa
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      const payload = parseJwt(token)
      setUser({ token, perfil: payload?.perfil, nome: payload?.nome })
    }
    setLoading(false)
  }, [])

  const login = (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    const payload = parseJwt(accessToken)
    setUser({ token: accessToken, perfil: payload?.perfil, nome: payload?.nome })
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
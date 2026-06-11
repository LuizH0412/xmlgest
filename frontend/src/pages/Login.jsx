import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const response = await api.post('/token/', { email, password: senha })
      login(response.data.access, response.data.refresh)
      navigate('/')
    } catch {
      setErro('Email ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Lado esquerdo */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-yellow-400 to-yellow-600 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-yellow-400 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-gray-900 dark:text-white font-bold text-base tracking-tight">FiscalHub</span>
            <span className="text-gray-400 dark:text-gray-500 text-xs">by Softcom</span>
          </div>
        </div>

        <div>
          <h1 className="text-white text-5xl font-bold leading-tight mb-4">
            Gestão Fiscal<br />Simplificada
          </h1>
          <p className="text-white/80 text-lg mb-10">
            Sua central de documentos fiscais.<br />
            Organize, monitore e acesse seus XMLs.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📄', label: 'NFe / NFCe' },
              { icon: '🚛', label: 'CTe / MDFe' },
              { icon: '🔍', label: 'Busca avançada' },
              { icon: '📊', label: 'Histórico completo' },
            ].map((item) => (
              <div key={item.label} className="bg-white/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <span>{item.icon}</span>
                <span className="text-white text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white font-bold">Softcom Cuiabá</span>
        </div>
      </div>

      {/* Lado direito */}
      <div className="w-full lg:w-1/2 bg-gray-900 flex flex-col justify-center px-8 lg:px-16">
        <div className="max-w-md w-full mx-auto">

          <h2 className="text-white text-3xl font-bold mb-1">Bom te ver!</h2>
          <p className="text-gray-400 mb-8">Entre com suas credenciais para acessar o sistema</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-yellow-400 transition"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-gray-300 text-sm">Senha</label>
              </div>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-yellow-400 transition pr-12"
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {mostrarSenha ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {erro && <p className="text-red-400 text-sm">{erro}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Acessar FiscalHub →'}
            </button>
          </form>

          <div className="flex justify-around mt-10 pt-8 border-t border-gray-800">
            <div className="text-center">
              <p className="text-white font-bold text-xl">24/7</p>
              <p className="text-gray-500 text-sm">Suporte</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-xl">99%</p>
              <p className="text-gray-500 text-sm">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-yellow-400 font-bold text-xl">Ativo</p>
              <p className="text-gray-500 text-sm">Status</p>
            </div>
          </div>

          <p className="text-center text-gray-600 text-sm mt-6">Softcom Tecnologia - Cuiabá</p>
        </div>
      </div>

    </div>
  )
}

export default Login
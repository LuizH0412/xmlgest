import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

function Dashboard() {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const carregarAlertas = async () => {
      try {
        const res = await api.get('/alertas/empresas-sem-xml/')
        setAlertas(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    carregarAlertas()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400 mt-1">Visão geral e alertas do sistema</p>
        </div>

        {/* Alertas */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">⚠️</span>
            <h2 className="text-white font-semibold text-lg">Empresas sem XMLs nos últimos 5 dias</h2>
            {!loading && (
              <span className="ml-auto bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                {alertas.length} alerta{alertas.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <p className="text-gray-400">Carregando alertas...</p>
          ) : alertas.length === 0 ? (
            <div className="flex items-center gap-3 text-green-400">
              <span className="text-2xl">✅</span>
              <p>Todas as empresas estão com XMLs em dia!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  onClick={() => navigate(`/empresas`)}
                  className="flex items-center justify-between bg-gray-800 rounded-lg px-5 py-4 border border-yellow-400/20 hover:border-yellow-400/50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-400/10 p-2 rounded-lg">
                      <span className="text-yellow-400 text-xl">🏢</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{alerta.nome}</p>
                      <p className="text-gray-400 text-sm">Código: {alerta.codigo_interno}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 text-sm font-medium">
                      {alerta.ultimo_xml
                        ? `Último XML: ${new Date(alerta.ultimo_xml).toLocaleDateString('pt-BR')}`
                        : 'Nenhum XML recebido'}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">Clique para ver detalhes →</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
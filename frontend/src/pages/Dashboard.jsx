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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 dark:text-white text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Monitoramento de XMLs fiscais</p>
        </div>

        {/* Status geral */}
        {!loading && (
          <div className={`rounded-2xl px-5 py-4 mb-6 flex items-center gap-3 ${
            alertas.length === 0
              ? 'bg-green-50 dark:bg-green-400/5 border border-green-200 dark:border-green-400/20'
              : 'bg-yellow-50 dark:bg-yellow-400/5 border border-yellow-200 dark:border-yellow-400/20'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              alertas.length === 0
                ? 'bg-green-100 dark:bg-green-400/10'
                : 'bg-yellow-100 dark:bg-yellow-400/10'
            }`}>
              {alertas.length === 0 ? (
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${
                alertas.length === 0
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-yellow-800 dark:text-yellow-300'
              }`}>
                {alertas.length === 0
                  ? 'Todas as empresas estão em dia'
                  : `${alertas.length} empresa${alertas.length !== 1 ? 's' : ''} sem XMLs recentes`}
              </p>
              <p className={`text-xs mt-0.5 ${
                alertas.length === 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-yellow-600 dark:text-yellow-500'
              }`}>
                {alertas.length === 0
                  ? 'Nenhuma inconsistência detectada nos últimos dias'
                  : 'Empresas que não enviaram XMLs nos últimos dias'}
              </p>
            </div>
          </div>
        )}

        {/* Lista de alertas */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-gray-900 dark:text-white text-sm font-semibold">Empresas sem XMLs</h2>
            {!loading && alertas.length > 0 && (
              <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {alertas.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="px-5 py-10 flex items-center justify-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
              <span className="text-gray-400 text-sm">Carregando...</span>
            </div>
          ) : alertas.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-400/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Tudo em ordem</p>
              <p className="text-gray-400 text-xs mt-1">Todas as empresas enviaram XMLs recentemente</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  onClick={() => navigate(`/empresas/${alerta.codigo_interno}`)}
                  className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-yellow-400/10 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-yellow-500 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{alerta.nome}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">#{alerta.codigo_interno}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {alerta.ultimo_xml
                          ? `Último: ${new Date(alerta.ultimo_xml).toLocaleDateString('pt-BR')}`
                          : 'Sem XMLs'}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      alerta.dias_sem_xml === null
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        : alerta.dias_sem_xml > 10
                          ? 'bg-red-100 dark:bg-red-400/10 text-red-600 dark:text-red-400'
                          : 'bg-yellow-100 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {alerta.dias_sem_xml === null
                        ? 'Nunca recebeu'
                        : `${alerta.dias_sem_xml}d sem XML`}
                    </span>
                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
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
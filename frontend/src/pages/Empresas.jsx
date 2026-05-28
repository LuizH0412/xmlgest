import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

function Empresas() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()
  const porPagina = 20

  const carregarEmpresas = async (pag = 1) => {
    setLoading(true)
    try {
      const res = await api.get(`/empresas/?page=${pag}`)
      setEmpresas(res.data.results)
      setTotal(res.data.count)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarEmpresas(pagina)
  }, [pagina])

  const totalPaginas = Math.ceil(total / porPagina)

  const empresasFiltradas = empresas.filter(e =>
    e.nome_fantasia.toLowerCase().includes(busca.toLowerCase()) ||
    e.cnpj.includes(busca) ||
    e.codigo_interno.includes(busca)
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Empresas</h1>
            <p className="text-gray-400 mt-1">{total} empresa{total !== 1 ? 's' : ''} cadastrada{total !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CNPJ ou código interno..."
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 border border-gray-800 focus:outline-none focus:border-yellow-400 transition"
          />
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Código</th>
                <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Nome Fantasia</th>
                <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">CNPJ</th>
                <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">Carregando...</td>
                </tr>
              ) : empresasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">Nenhuma empresa encontrada</td>
                </tr>
              ) : (
                empresasFiltradas.map((empresa) => (
                  <tr
                    key={empresa.id}
                    onClick={() => navigate(`/empresas/${empresa.codigo_interno}`)}
                    className="border-b border-gray-800 hover:bg-gray-800 transition cursor-pointer"
                  >
                    <td className="px-6 py-4 text-yellow-400 font-mono text-sm">{empresa.codigo_interno}</td>
                    <td className="px-6 py-4 text-white font-medium">{empresa.nome_fantasia}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{empresa.cnpj}</td>
                    <td className="px-6 py-4">
                      {empresa.desativado ? (
                        <span className="bg-red-400/10 text-red-400 text-xs px-2 py-1 rounded-full">Inativa</span>
                      ) : (
                        <span className="bg-green-400/10 text-green-400 text-xs px-2 py-1 rounded-full">Ativa</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-gray-400 text-sm">
              Página {pagina} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-800 hover:border-yellow-400 transition disabled:opacity-50"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-800 hover:border-yellow-400 transition disabled:opacity-50"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Empresas
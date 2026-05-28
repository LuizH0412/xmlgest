import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

function EmpresaDetalhe() {
  const { codigo } = useParams()
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('documentos')
  const [mostrarSecret, setMostrarSecret] = useState(false)
  const [copiado, setCopiado] = useState('')

  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const carregarEmpresa = async () => {
      try {
        const res = await api.get(`/empresas/codigo/${codigo}/`)
        setEmpresa(res.data)
      } catch {
        navigate('/empresas')
      } finally {
        setLoading(false)
      }
    }
    carregarEmpresa()
  }, [codigo])

  useEffect(() => {
    if (!empresa) return

    const controller = new AbortController()

    const carregarDocumentos = async () => {
      setLoadingDocs(true)
      try {
        let url = `/documentos/?empresa=${empresa.id}&page=${pagina}`
        if (filtroTipo)       url += `&tipo=${filtroTipo}`
        if (filtroDataInicio) url += `&data_emissao__gte=${filtroDataInicio}`
        if (filtroDataFim)    url += `&data_emissao__lte=${filtroDataFim}`

        const res = await api.get(url, { signal: controller.signal })
        setDocumentos(res.data.results)
        setTotal(res.data.count)
      } catch (err) {
        if (err.name !== 'CanceledError') console.error(err)
      } finally {
        setLoadingDocs(false)
      }
    }

    carregarDocumentos()
    return () => controller.abort()
  }, [empresa, pagina, filtroTipo, filtroDataInicio, filtroDataFim])

  const copiar = (texto, campo) => {
    navigator.clipboard.writeText(texto)
    setCopiado(campo)
    setTimeout(() => setCopiado(''), 2000)
  }

  const limparFiltros = () => {
    setFiltroTipo('')
    setFiltroDataInicio('')
    setFiltroDataFim('')
    setPagina(1)
  }

  const temFiltrosAtivos = filtroTipo || filtroDataInicio || filtroDataFim
  const totalPaginas = Math.ceil(total / 20)

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-yellow-400">Carregando...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/empresas')}
            className="text-gray-400 hover:text-white transition text-sm"
          >
            ← Voltar
          </button>
          <div>
            <h1 className="text-white text-2xl font-bold">{empresa.nome_fantasia}</h1>
            <p className="text-gray-400 text-sm mt-1">Código: {empresa.codigo_interno} · CNPJ: {empresa.cnpj}</p>
          </div>
          <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${empresa.desativado ? 'bg-red-400/10 text-red-400' : 'bg-green-400/10 text-green-400'}`}>
            {empresa.desativado ? 'Inativa' : 'Ativa'}
          </span>
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 w-fit border border-gray-800">
          {['documentos', 'informacoes', 'credenciais'].map((aba) => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${abaAtiva === aba ? 'bg-yellow-400 text-gray-900' : 'text-gray-400 hover:text-white'}`}
            >
              {aba === 'informacoes' ? 'Informações' : aba === 'credenciais' ? 'Credenciais' : 'Documentos'}
            </button>
          ))}
        </div>

        {/* Aba Documentos */}
        {abaAtiva === 'documentos' && (
          <div>
            {/* Filtros */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-4">
              <div className="flex flex-wrap gap-3 items-end">

                {/* Tipo */}
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Tipo</label>
                  <select
                    value={filtroTipo}
                    onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1) }}
                    className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-yellow-400 text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="NFe">NFe</option>
                    <option value="NFCe">NFCe</option>
                    <option value="CTe">CTe</option>
                    <option value="MDFe">MDFe</option>
                  </select>
                </div>

                {/* Período */}
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Período</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={filtroDataInicio}
                      onChange={(e) => { setFiltroDataInicio(e.target.value); setPagina(1) }}
                      className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-yellow-400 text-sm"
                    />
                    <span className="text-gray-500 text-sm">→</span>
                    <input
                      type="date"
                      value={filtroDataFim}
                      min={filtroDataInicio || undefined}
                      onChange={(e) => { setFiltroDataFim(e.target.value); setPagina(1) }}
                      className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-yellow-400 text-sm"
                    />
                  </div>
                </div>

                {temFiltrosAtivos && (
                  <button
                    onClick={limparFiltros}
                    className="text-gray-400 hover:text-red-400 text-sm transition self-end pb-2"
                  >
                    Limpar filtros
                  </button>
                )}

                <span className="ml-auto text-gray-400 text-sm self-end pb-2">
                  {total} documento{total !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Tabela documentos */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Número</th>
                    <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Tipo</th>
                    <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Emissão</th>
                    <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Valor</th>
                    <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDocs ? (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-8">Carregando...</td></tr>
                  ) : documentos.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-8">Nenhum documento encontrado</td></tr>
                  ) : (
                    documentos.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                        <td className="px-6 py-4 text-white font-mono text-sm">{doc.numero_nota}</td>
                        <td className="px-6 py-4">
                          <span className="bg-yellow-400/10 text-yellow-400 text-xs px-2 py-1 rounded-full">{doc.tipo}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(doc.data_emissao + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-white text-sm">
                          R$ {parseFloat(doc.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${doc.status === 'autorizado' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                            {doc.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-gray-400 text-sm">Página {pagina} de {totalPaginas}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-800 hover:border-yellow-400 transition disabled:opacity-50">
                    ← Anterior
                  </button>
                  <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-800 hover:border-yellow-400 transition disabled:opacity-50">
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aba Informações */}
        {abaAtiva === 'informacoes' && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
            {[
              { label: 'Razão Social', value: empresa.razao_social },
              { label: 'Nome Fantasia', value: empresa.nome_fantasia },
              { label: 'CNPJ', value: empresa.cnpj },
              { label: 'Inscrição Estadual', value: empresa.inscricao_estadual || '—' },
              { label: 'Email da Contabilidade', value: empresa.email_contabilidade || '—' },
              { label: 'Código Interno', value: empresa.codigo_interno },
              { label: 'Cadastrado em', value: new Date(empresa.criado_em).toLocaleDateString('pt-BR') },
            ].map((item) => (
              <div key={item.label} className="flex justify-between border-b border-gray-800 pb-4">
                <span className="text-gray-400 text-sm">{item.label}</span>
                <span className="text-white text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Aba Credenciais */}
        {abaAtiva === 'credenciais' && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">Client ID</p>
              <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                <code className="text-yellow-400 text-sm flex-1 break-all">{empresa.client_id}</code>
                <button
                  onClick={() => copiar(empresa.client_id, 'client_id')}
                  className="text-gray-400 hover:text-white text-xs transition whitespace-nowrap"
                >
                  {copiado === 'client_id' ? '✅ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-2">Client Secret</p>
              <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                <code className="text-yellow-400 text-sm flex-1 break-all">
                  {mostrarSecret ? empresa.client_secret : '••••••••••••••••••••••••••••••••'}
                </code>
                <button
                  onClick={() => setMostrarSecret(!mostrarSecret)}
                  className="text-gray-400 hover:text-white text-xs transition whitespace-nowrap"
                >
                  {mostrarSecret ? 'Ocultar' : 'Revelar'}
                </button>
                {mostrarSecret && (
                  <button
                    onClick={() => copiar(empresa.client_secret, 'client_secret')}
                    className="text-gray-400 hover:text-white text-xs transition whitespace-nowrap"
                  >
                    {copiado === 'client_secret' ? '✅ Copiado' : 'Copiar'}
                  </button>
                )}
              </div>
            </div>

            <p className="text-gray-500 text-xs">⚠️ Mantenha essas credenciais em segurança. Use-as para configurar o coletor desktop.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmpresaDetalhe
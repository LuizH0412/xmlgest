import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import DateRangePicker from '../components/DateRangePicker'
import { ModalConfirmacao } from '../components/ModalConfirmacao'

// ─── Button Primitives ────────────────────────────────────────────────────────

function BtnPrimary({ children, onClick, disabled, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-gray-900 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm ${className}`}
    >
      {children}
    </button>
  )
}

function BtnGhost({ children, onClick, disabled, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-white active:bg-gray-100 dark:active:bg-gray-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}

function BtnAccent({ children, onClick, disabled, color = 'yellow', className = '' }) {
  const colors = {
    yellow: 'border-yellow-300 dark:border-yellow-500/40 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-400/10 hover:border-yellow-400',
    green:  'border-green-300  dark:border-green-500/40  text-green-700  dark:text-green-400  hover:bg-green-50  dark:hover:bg-green-400/10  hover:border-green-400',
    red:    'border-red-300    dark:border-red-500/40    text-red-700    dark:text-red-400    hover:bg-red-50    dark:hover:bg-red-400/10    hover:border-red-400',
    blue:   'border-blue-300   dark:border-blue-500/40   text-blue-700   dark:text-blue-400   hover:bg-blue-50   dark:hover:bg-blue-400/10   hover:border-blue-400',
    purple: 'border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-400/10 hover:border-purple-400',
    orange: 'border-orange-300 dark:border-orange-500/40 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-400/10 hover:border-orange-400',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium bg-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colors[color]} ${className}`}
    >
      {children}
    </button>
  )
}

function BtnDanger({ children, onClick, disabled, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-400 text-xs font-medium bg-transparent hover:bg-red-50 dark:hover:bg-red-400/10 hover:border-red-400 transition-all disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ children, color = 'gray' }) {
  const colors = {
    green:  'bg-green-50 dark:bg-green-400/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-transparent',
    red:    'bg-red-50 dark:bg-red-400/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-transparent',
    yellow: 'bg-yellow-50 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-transparent',
    orange: 'bg-orange-50 dark:bg-orange-400/10 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-transparent',
    gray:   'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-transparent',
    blue:   'bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-transparent',
    purple: 'bg-purple-50 dark:bg-purple-400/10 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-transparent',
  }
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${colors[color]}`}>
      {children}
    </span>
  )
}

// ─── Hook de paginação reutilizável ──────────────────────────────────────────

function usePagination(items, perPage = 20) {
  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.ceil((items?.length || 0) / perPage)
  const paginados = (items || []).slice((pagina - 1) * perPage, pagina * perPage)
  useEffect(() => { setPagina(1) }, [items])
  return { paginados, pagina, setPagina, totalPaginas }
}

// ─── Paginação de tabelas ─────────────────────────────────────────────────────

function PaginacaoTabela({ pagina, totalPaginas, setPagina, label }) {
  if (totalPaginas <= 1) return null
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
      <span className="text-gray-400 dark:text-gray-600 text-xs">
        {label} · página <span className="text-gray-600 dark:text-gray-400">{pagina}</span> de {totalPaginas}
      </span>
      <div className="flex gap-1.5">
        <button
          onClick={() => setPagina(p => Math.max(1, p - 1))}
          disabled={pagina === 1}
          className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          ← Anterior
        </button>
        <button
          onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
          disabled={pagina === totalPaginas}
          className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Próxima →
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hoje = new Date()
const primeiroDiaMesStr = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
const ultimoDiaMesStr   = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

const inputCls = (erro) =>
  `w-full bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 border text-sm transition focus:outline-none ${
    erro
      ? 'border-red-400 focus:border-red-400'
      : 'border-gray-200 dark:border-gray-700 focus:border-yellow-400'
  }`

// ─── Main Component ───────────────────────────────────────────────────────────

function EmpresaDetalhe() {
  const { codigo } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const podeDesativar = ['admin', 'supervisao'].includes(user?.perfil)

  const [empresa, setEmpresa] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('documentos')
  const [mostrarSecret, setMostrarSecret] = useState(false)
  const [copiado, setCopiado] = useState('')
  const [enviandoXmls, setEnviandoXmls] = useState(false)
  const [msgEnvioXmls, setMsgEnvioXmls] = useState(null)

  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroSerie, setFiltroSerie] = useState('')
  const [filtroNumero, setFiltroNumero] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState(primeiroDiaMesStr)
  const [filtroDataFim, setFiltroDataFim] = useState(ultimoDiaMesStr)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)

  const [modalExcluir, setModalExcluir] = useState(null)
  const [gerandoRelatorio, setGerandoRelatorio] = useState(null)

  const [arquivoSefaz, setArquivoSefaz] = useState(null)
  const [analisando, setAnalisando] = useState(false)
  const [resultadoInconsistencias, setResultadoInconsistencias] = useState(null)
  const [erroInconsistencia, setErroInconsistencia] = useState('')

  const [certArquivo, setCertArquivo] = useState(null)
  const [certSenha, setCertSenha] = useState('')
  const [mostrarSenhaCert, setMostrarSenhaCert] = useState(false)
  const [enviandoCert, setEnviandoCert] = useState(false)
  const [certMsg, setCertMsg] = useState(null)
  const [removendoCert, setRemovendoCert] = useState(false)
  const [confirmarRemocao, setConfirmarRemocao] = useState(false)

  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const [formEditar, setFormEditar] = useState({})
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [errosEdicao, setErrosEdicao] = useState({})
  const [erroGeralEdicao, setErroGeralEdicao] = useState('')

  const [confirmarDesativar, setConfirmarDesativar] = useState(false)
  const [desativando, setDesativando] = useState(false)

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
        if (filtroTipo) url += `&tipo=${filtroTipo}`
        if (filtroSerie) url += `&serie=${filtroSerie}`
        if (filtroNumero) url += `&numero_nota=${filtroNumero}`
        if (filtroDataInicio) url += `&data_emissao__gte=${filtroDataInicio}`
        if (filtroDataFim) url += `&data_emissao__lte=${filtroDataFim}`
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
  }, [empresa, pagina, filtroTipo, filtroSerie, filtroNumero, filtroDataInicio, filtroDataFim])

  const copiar = (texto, campo) => {
    navigator.clipboard.writeText(texto)
    setCopiado(campo)
    setTimeout(() => setCopiado(''), 2000)
  }

  const limparFiltros = () => {
    setFiltroTipo('')
    setFiltroSerie('')
    setFiltroNumero('')
    setFiltroDataInicio(primeiroDiaMesStr)
    setFiltroDataFim(ultimoDiaMesStr)
    setPagina(1)
  }

  const buildFiltrosQuery = () => {
    let q = `empresa=${empresa.id}`
    if (filtroTipo) q += `&tipo=${filtroTipo}`
    if (filtroSerie) q += `&serie=${filtroSerie}`
    if (filtroNumero) q += `&numero_nota=${filtroNumero}`
    if (filtroDataInicio) q += `&data_emissao__gte=${filtroDataInicio}`
    if (filtroDataFim) q += `&data_emissao__lte=${filtroDataFim}`
    return q
  }

  const downloadRelatorio = async (formato) => {
    setGerandoRelatorio(formato)
    try {
      const url = `/documentos/relatorio/${formato}/?${buildFiltrosQuery()}`
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], {
        type: formato === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.setAttribute('download', `relatorio_${empresa.codigo_interno}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(link.href)
    } catch {
      alert(`Erro ao gerar relatório ${formato.toUpperCase()}.`)
    } finally {
      setGerandoRelatorio(null)
    }
  }

  const downloadXml = async (chaveAcesso) => {
    try {
      const res = await api.get(`/documentos/${chaveAcesso}/download-xml/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${chaveAcesso}.xml`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch { alert('Erro ao baixar XML.') }
  }

  const downloadPdf = async (chaveAcesso) => {
    try {
      const res = await api.get(`/documentos/${chaveAcesso}/download-pdf/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${chaveAcesso}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch { alert('Erro ao baixar PDF.') }
  }

  const excluirDocumento = async () => {
    try {
      await api.delete(`/documentos/${modalExcluir}/`)
      setDocumentos(docs => docs.filter(d => d.chave_acesso !== modalExcluir))
      setTotal(t => t - 1)
      setModalExcluir(null)
    } catch {
      alert('Erro ao excluir documento.')
    }
  }

  const downloadXmlsZip = async () => {
    try {
      const url = `/documentos/download-xmls/?${buildFiltrosQuery()}`
      const res = await api.get(url, { responseType: 'blob' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }))
      link.setAttribute('download', `xmls_${empresa.codigo_interno}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(link.href)
    } catch {
      alert('Erro ao baixar XMLs.')
    }
  }

  const analisarInconsistencias = async () => {
    if (!arquivoSefaz) { setErroInconsistencia('Selecione a planilha da SEFAZ.'); return }
    setAnalisando(true)
    setErroInconsistencia('')
    setResultadoInconsistencias(null)
    try {
      const formData = new FormData()
      formData.append('arquivo', arquivoSefaz)
      const res = await api.post(`/documentos/inconsistencias/?empresa=${empresa.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResultadoInconsistencias(res.data)
    } catch (err) {
      setErroInconsistencia(err.response?.data?.detail || 'Erro ao analisar planilha.')
    } finally {
      setAnalisando(false)
    }
  }

  const enviarCertificado = async () => {
    if (!certArquivo || !certSenha) {
      setCertMsg({ tipo: 'erro', texto: 'Selecione o arquivo .pfx e informe a senha.' })
      return
    }
    setEnviandoCert(true)
    setCertMsg(null)
    try {
      const formData = new FormData()
      formData.append('certificado_pfx', certArquivo)
      formData.append('senha', certSenha)
      await api.patch(`/empresas/${empresa.codigo_interno}/certificado/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setCertArquivo(null)
      setCertSenha('')
      setCertMsg(null)
      const empresaAtualizada = await api.get(`/empresas/codigo/${codigo}/`)
      setEmpresa(empresaAtualizada.data)
    } catch (err) {
      const data = err.response?.data
      let texto = 'Erro ao enviar certificado.'
      if (data?.senha) texto = data.senha
      else if (data?.cnpj) texto = data.cnpj
      else if (data?.detail) texto = data.detail
      else if (data?.non_field_errors) texto = data.non_field_errors[0]
      setCertMsg({ tipo: 'erro', texto })
    } finally {
      setEnviandoCert(false)
    }
  }

  const downloadCertificado = async () => {
    try {
      const res = await api.get(`/empresas/${empresa.codigo_interno}/certificado/download/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `certificado_${empresa.cnpj}.pfx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch { alert('Erro ao baixar certificado.') }
  }

  const removerCertificado = async () => {
    setRemovendoCert(true)
    try {
      await api.patch(`/empresas/${empresa.codigo_interno}/certificado/remover/`)
      setConfirmarRemocao(false)
      const empresaAtualizada = await api.get(`/empresas/codigo/${codigo}/`)
      setEmpresa(empresaAtualizada.data)
    } catch {
      alert('Erro ao remover certificado.')
    } finally {
      setRemovendoCert(false)
    }
  }

  const abrirModalEditar = () => {
    setFormEditar({
      razao_social: empresa.razao_social || '',
      nome_fantasia: empresa.nome_fantasia || '',
      inscricao_estadual: empresa.inscricao_estadual || '',
      email_contabilidade: empresa.email_contabilidade || '',
    })
    setErrosEdicao({})
    setErroGeralEdicao('')
    setModalEditarAberto(true)
  }

  const fecharModalEditar = () => { if (!salvandoEdicao) setModalEditarAberto(false) }
  const handleChangeEditar = (e) => {
    setFormEditar(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrosEdicao(er => ({ ...er, [e.target.name]: '' }))
  }

  const salvarEdicao = async () => {
    setSalvandoEdicao(true)
    setErrosEdicao({})
    setErroGeralEdicao('')
    try {
      await api.patch(`/empresas/${empresa.codigo_interno}/`, formEditar)
      const empresaAtualizada = await api.get(`/empresas/codigo/${codigo}/`)
      setEmpresa(empresaAtualizada.data)
      setModalEditarAberto(false)
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data
        const camposConhecidos = ['razao_social', 'nome_fantasia', 'inscricao_estadual', 'email_contabilidade']
        const novosErros = {}
        camposConhecidos.forEach(campo => {
          if (data[campo]) novosErros[campo] = Array.isArray(data[campo]) ? data[campo][0] : data[campo]
        })
        if (Object.keys(novosErros).length > 0) setErrosEdicao(novosErros)
        else setErroGeralEdicao(data.detail || 'Erro ao salvar alterações.')
      } else {
        setErroGeralEdicao('Erro de conexão.')
      }
    } finally {
      setSalvandoEdicao(false)
    }
  }

  const toggleDesativar = async () => {
    setDesativando(true)
    try {
      await api.patch(`/empresas/${empresa.codigo_interno}/`, { desativado: !empresa.desativado })
      const empresaAtualizada = await api.get(`/empresas/codigo/${codigo}/`)
      setEmpresa(empresaAtualizada.data)
      setConfirmarDesativar(false)
    } catch {
      alert('Erro ao alterar status da empresa.')
    } finally {
      setDesativando(false)
    }
  }

  const enviarXmlsManual = async () => {
    setEnviandoXmls(true)
    setMsgEnvioXmls(null)
    try {
      await api.post(`/documentos/enviar-xmls/?${buildFiltrosQuery()}`)
      setMsgEnvioXmls({ tipo: 'sucesso', texto: 'XMLs enviados para o email da contabilidade.' })
    } catch (err) {
      const detalhe = err.response?.data?.detail || 'Erro ao enviar XMLs.'
      setMsgEnvioXmls({ tipo: 'erro', texto: detalhe })
    } finally {
      setEnviandoXmls(false)
    }
  }

  const temFiltrosAtivos = filtroTipo || filtroSerie || filtroNumero ||
    filtroDataInicio !== primeiroDiaMesStr || filtroDataFim !== ultimoDiaMesStr
  const totalPaginas = Math.ceil(total / 20)

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <p className="text-yellow-500 dark:text-yellow-400 text-sm animate-pulse">Carregando...</p>
    </div>
  )

  const certVencido = empresa.certificado_validade && new Date(empresa.certificado_validade) < new Date()
  const abas = ['documentos', 'informacoes', 'inconsistencias', 'upload', ...(empresa.desativado ? [] : ['credenciais'])]
  const abaLabels = { documentos: 'Documentos', informacoes: 'Informações', inconsistencias: 'Inconsistências', upload: 'Importar XML', credenciais: 'Credenciais' }

  // Classes de card padrão
  const card = 'bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-start gap-4 mb-7">
          <button
            onClick={() => navigate('/empresas')}
            className="mt-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition text-sm flex items-center gap-1"
          >
            ← Voltar
          </button>
          <div className="flex-1">
            <h1 className="text-gray-900 dark:text-white text-2xl font-bold tracking-tight">{empresa.nome_fantasia}</h1>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">
              Código: <span className="text-gray-600 dark:text-gray-400">{empresa.codigo_interno}</span>
              {' · '}
              CNPJ: <span className="text-gray-600 dark:text-gray-400">{empresa.cnpj}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <Badge color={empresa.desativado ? 'red' : 'green'}>
              {empresa.desativado ? 'Inativa' : 'Ativa'}
            </Badge>
            {podeDesativar && (
              !confirmarDesativar ? (
                empresa.desativado
                  ? <BtnAccent color="green" onClick={() => setConfirmarDesativar(true)}>Reativar</BtnAccent>
                  : <BtnDanger onClick={() => setConfirmarDesativar(true)}>Desativar</BtnDanger>
              ) : (
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5 shadow-sm">
                  <span className="text-gray-500 dark:text-gray-400 text-xs">{empresa.desativado ? 'Reativar?' : 'Desativar?'}</span>
                  <button
                    onClick={toggleDesativar}
                    disabled={desativando}
                    className={`text-xs font-semibold px-2 py-0.5 rounded transition disabled:opacity-50 ${
                      empresa.desativado ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300' : 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
                    }`}
                  >
                    {desativando ? '...' : 'Sim'}
                  </button>
                  <button onClick={() => setConfirmarDesativar(false)} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition">
                    Não
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0.5 mb-6 bg-gray-100 dark:bg-gray-900/60 rounded-xl p-1 w-fit border border-gray-200 dark:border-gray-800">
          {abas.map((aba) => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                abaAtiva === aba
                  ? 'bg-yellow-400 text-gray-900 shadow-sm'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {abaLabels[aba]}
            </button>
          ))}
        </div>

        {/* ══ Aba: Documentos ══ */}
        {abaAtiva === 'documentos' && (
          <div>
            {/* Filtros */}
            <div className={`${card} px-5 py-4 mb-4`}>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="text-gray-500 dark:text-gray-500 text-xs mb-1.5 block">Tipo</label>
                  <select
                    value={filtroTipo}
                    onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1) }}
                    className="bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-yellow-400 text-sm transition"
                  >
                    <option value="">Todos</option>
                    <option value="NFe">NFe</option>
                    <option value="NFCe">NFCe</option>
                    <option value="CTe">CTe</option>
                    <option value="MDFe">MDFe</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-500 text-xs mb-1.5 block">Série</label>
                  <input
                    type="text"
                    value={filtroSerie}
                    onChange={(e) => { setFiltroSerie(e.target.value); setPagina(1) }}
                    placeholder="Ex: 1"
                    className="w-20 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-yellow-400 text-sm transition"
                  />
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-500 text-xs mb-1.5 block">Número</label>
                  <input
                    type="text"
                    value={filtroNumero}
                    onChange={(e) => { setFiltroNumero(e.target.value); setPagina(1) }}
                    placeholder="Ex: 1468"
                    className="w-28 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-yellow-400 text-sm transition"
                  />
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-500 text-xs mb-1.5 block">Período</label>
                  <DateRangePicker
                    value={{
                      start: filtroDataInicio ? new Date(filtroDataInicio + 'T00:00:00') : null,
                      end:   filtroDataFim    ? new Date(filtroDataFim    + 'T00:00:00') : null,
                    }}
                    onChange={({ start, end }) => {
                      setFiltroDataInicio(start.toISOString().split('T')[0])
                      setFiltroDataFim(end.toISOString().split('T')[0])
                      setPagina(1)
                    }}
                  />
                </div>
                {temFiltrosAtivos && (
                  <button
                    onClick={limparFiltros}
                    className="text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-xs transition self-end pb-2"
                  >
                    ✕ Limpar filtros
                  </button>
                )}
                <div className="ml-auto flex items-center gap-2 self-end">
                  <span className="text-gray-400 dark:text-gray-500 text-xs mr-1">
                    {total} doc{total !== 1 ? 's' : ''}
                  </span>
                  {total > 0 && (
                    <div className="flex items-center gap-1.5">
                      {empresa.email_contabilidade && (
                        <BtnAccent color="purple" onClick={enviarXmlsManual} disabled={enviandoXmls}>
                          {enviandoXmls ? 'Enviando…' : '✉ Enviar XMLs'}
                        </BtnAccent>
                      )}
                      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                      <BtnAccent color="green" onClick={() => downloadRelatorio('excel')} disabled={!!gerandoRelatorio}>
                        {gerandoRelatorio === 'excel' ? '…' : '↓ Excel'}
                      </BtnAccent>
                      <BtnAccent color="red" onClick={() => downloadRelatorio('pdf')} disabled={!!gerandoRelatorio}>
                        {gerandoRelatorio === 'pdf' ? '…' : '↓ PDF'}
                      </BtnAccent>
                      <BtnAccent color="yellow" onClick={downloadXmlsZip}>
                        ↓ XMLs
                      </BtnAccent>
                    </div>
                  )}
                </div>
              </div>
              {msgEnvioXmls && (
                <p className={`text-xs mt-3 ${msgEnvioXmls.tipo === 'sucesso' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {msgEnvioXmls.tipo === 'sucesso' ? '✓' : '✕'} {msgEnvioXmls.texto}
                </p>
              )}
            </div>

            {/* Tabela de documentos */}
            <div className={`${card} overflow-hidden`}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Número', 'Série', 'Tipo', 'Emissão', 'Valor', 'Status', ''].map((h) => (
                      <th
                        key={h}
                        className={`text-gray-400 dark:text-gray-500 text-xs px-6 py-3.5 font-medium tracking-wide ${h === '' ? 'text-right' : 'text-left'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingDocs ? (
                    <tr><td colSpan={7} className="text-center text-gray-400 dark:text-gray-500 py-10 text-sm animate-pulse">Carregando…</td></tr>
                  ) : documentos.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-gray-400 dark:text-gray-500 py-10 text-sm">Nenhum documento encontrado</td></tr>
                  ) : (
                    documentos.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                        <td className="px-6 py-3.5 text-gray-900 dark:text-white font-mono text-sm">{doc.numero_nota}</td>
                        <td className="px-6 py-3.5 text-gray-400 dark:text-gray-500 text-sm">{doc.serie}</td>
                        <td className="px-6 py-3.5"><Badge color="yellow">{doc.tipo}</Badge></td>
                        <td className="px-6 py-3.5 text-gray-500 dark:text-gray-400 text-sm">
                          {new Date(doc.data_emissao + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-3.5 text-gray-900 dark:text-white text-sm">
                          R$ {parseFloat(doc.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge color={doc.status === 'autorizado' ? 'green' : 'red'}>{doc.status}</Badge>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex gap-1.5 justify-end">
                            <BtnGhost onClick={() => downloadXml(doc.chave_acesso)}>XML</BtnGhost>
                            <BtnGhost onClick={() => downloadPdf(doc.chave_acesso)}>PDF</BtnGhost>
                            {user?.perfil === 'admin' && (
                              <BtnGhost
                                onClick={() => setModalExcluir(doc.chave_acesso)}
                                className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 border-red-200 dark:border-red-400/20 hover:border-red-300 dark:hover:border-red-400/50"
                              >
                                Excluir
                              </BtnGhost>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Página <span className="text-gray-700 dark:text-gray-300">{pagina}</span> de {totalPaginas}
                </p>
                <div className="flex gap-2">
                  <BtnGhost onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}>← Anterior</BtnGhost>
                  <BtnGhost onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>Próxima →</BtnGhost>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ Aba: Informações ══ */}
        {abaAtiva === 'informacoes' && (
          <div className={`${card} p-6`}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-900 dark:text-white text-sm font-semibold">Dados da Empresa</p>
              {!empresa.desativado && <BtnPrimary onClick={abrirModalEditar}>✏ Editar</BtnPrimary>}
            </div>
            <div className="space-y-0">
              {[
                { label: 'Razão Social', value: empresa.razao_social },
                { label: 'Nome Fantasia', value: empresa.nome_fantasia },
                { label: 'CNPJ', value: empresa.cnpj },
                { label: 'Inscrição Estadual', value: empresa.inscricao_estadual || '—' },
                { label: 'Email da Contabilidade', value: empresa.email_contabilidade || '—' },
                { label: 'Código Interno', value: empresa.codigo_interno },
                { label: 'Cadastrado em', value: new Date(empresa.criado_em).toLocaleDateString('pt-BR') },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-3.5 border-b border-gray-100 dark:border-gray-800/70 last:border-0">
                  <span className="text-gray-400 dark:text-gray-500 text-sm">{item.label}</span>
                  <span className="text-gray-900 dark:text-gray-200 text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ Aba: Inconsistências ══ */}
        {abaAtiva === 'inconsistencias' && (
          <InconsistenciasAba
            empresa={empresa}
            arquivoSefaz={arquivoSefaz}
            setArquivoSefaz={setArquivoSefaz}
            analisando={analisando}
            analisarInconsistencias={analisarInconsistencias}
            erroInconsistencia={erroInconsistencia}
            setErroInconsistencia={setErroInconsistencia}
            resultadoInconsistencias={resultadoInconsistencias}
            setResultadoInconsistencias={setResultadoInconsistencias}
          />
        )}

        {/* ══ Aba: Upload XML ══ */}
        {abaAtiva === 'upload' && (
          <UploadXmlAba empresa={empresa} />
        )}

        {/* ══ Aba: Credenciais ══ */}
        {abaAtiva === 'credenciais' && (
          <div className="space-y-5">
            {/* Client ID / Secret */}
            <div className={`${card} p-6 space-y-5`}>
              <div>
                <p className="text-gray-400 dark:text-gray-500 text-xs mb-2">Client ID</p>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700">
                  <code className="text-yellow-600 dark:text-yellow-400 text-sm flex-1 break-all">{empresa.client_id}</code>
                  <button onClick={() => copiar(empresa.client_id, 'client_id')} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs transition whitespace-nowrap">
                    {copiado === 'client_id' ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-gray-400 dark:text-gray-500 text-xs mb-2">Client Secret</p>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700">
                  <code className="text-yellow-600 dark:text-yellow-400 text-sm flex-1 break-all">
                    {mostrarSecret ? empresa.client_secret : '••••••••••••••••••••••••••••••••'}
                  </code>
                  <button onClick={() => setMostrarSecret(!mostrarSecret)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs transition whitespace-nowrap">
                    {mostrarSecret ? 'Ocultar' : 'Revelar'}
                  </button>
                  {mostrarSecret && (
                    <button onClick={() => copiar(empresa.client_secret, 'client_secret')} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs transition whitespace-nowrap">
                      {copiado === 'client_secret' ? '✓ Copiado' : 'Copiar'}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-400 dark:text-gray-600 text-xs">⚠ Mantenha essas credenciais em segurança. Use-as para configurar o coletor desktop.</p>
            </div>

            {/* Certificado Digital */}
            <div className={`${card} p-6`}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-gray-900 dark:text-white text-sm font-semibold">Certificado Digital (A1)</p>
                {!empresa.certificado_validade && <span className="text-gray-400 dark:text-gray-600 text-xs">Nenhum certificado cadastrado</span>}
              </div>
              {empresa.certificado_validade ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                        {['Empresa Registrada', 'Validade', 'Status', ''].map(h => (
                          <th key={h} className={`text-gray-400 dark:text-gray-500 text-xs px-5 py-3 font-medium ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                        <td className="px-5 py-4 text-gray-700 dark:text-gray-200 text-sm">{empresa.nome_fantasia} · {empresa.cnpj}</td>
                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300 text-sm">
                          {new Date(empresa.certificado_validade + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-5 py-4">
                          <Badge color={certVencido ? 'red' : 'green'}>{certVencido ? 'Vencido' : 'Válido'}</Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <BtnGhost onClick={downloadCertificado}>↓ Baixar</BtnGhost>
                            {!confirmarRemocao ? (
                              <BtnDanger onClick={() => setConfirmarRemocao(true)}>Remover</BtnDanger>
                            ) : (
                              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5">
                                <span className="text-gray-400 dark:text-gray-500 text-xs">Confirmar?</span>
                                <button onClick={removerCertificado} disabled={removendoCert} className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 font-semibold transition disabled:opacity-50">
                                  {removendoCert ? '…' : 'Sim'}
                                </button>
                                <button onClick={() => setConfirmarRemocao(false)} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white transition">Não</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 dark:text-gray-500 text-xs mb-1.5 block">Arquivo .pfx</label>
                    <input
                      type="file"
                      accept=".pfx,.p12"
                      onChange={(e) => { setCertArquivo(e.target.files[0]); setCertMsg(null) }}
                      className="w-full bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-sm rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-yellow-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-yellow-50 dark:file:bg-yellow-400/10 file:text-yellow-700 dark:file:text-yellow-400 file:text-xs cursor-pointer transition"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 dark:text-gray-500 text-xs mb-1.5 block">Senha do certificado</label>
                    <div className="flex items-center gap-2">
                      <input
                        type={mostrarSenhaCert ? 'text' : 'password'}
                        value={certSenha}
                        onChange={(e) => { setCertSenha(e.target.value); setCertMsg(null) }}
                        placeholder="Digite a senha do .pfx"
                        className="flex-1 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-yellow-400 text-sm transition"
                      />
                      <button onClick={() => setMostrarSenhaCert(!mostrarSenhaCert)} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition whitespace-nowrap px-1">
                        {mostrarSenhaCert ? 'Ocultar' : 'Revelar'}
                      </button>
                    </div>
                  </div>
                  {certMsg && (
                    <div className={`flex items-start gap-2 rounded-xl px-4 py-3 border ${certMsg.tipo === 'sucesso' ? 'bg-green-50 dark:bg-green-400/10 border-green-100 dark:border-green-400/20' : 'bg-red-50 dark:bg-red-400/10 border-red-100 dark:border-red-400/20'}`}>
                      <span className={`text-sm mt-0.5 ${certMsg.tipo === 'sucesso' ? 'text-green-500' : 'text-red-400'}`}>{certMsg.tipo === 'sucesso' ? '✓' : '✕'}</span>
                      <p className={`text-xs ${certMsg.tipo === 'sucesso' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{certMsg.texto}</p>
                    </div>
                  )}
                  <BtnPrimary onClick={enviarCertificado} disabled={enviandoCert}>
                    {enviandoCert ? 'Enviando…' : 'Enviar certificado'}
                  </BtnPrimary>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Editar ── */}
      {modalEditarAberto && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={fecharModalEditar}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-gray-900 dark:text-white font-semibold text-base">Editar Empresa</h2>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{empresa.nome_fantasia}</p>
              </div>
              <button onClick={fecharModalEditar} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { name: 'razao_social', label: 'Razão Social', required: true },
                { name: 'nome_fantasia', label: 'Nome Fantasia', required: true },
                { name: 'inscricao_estadual', label: 'Inscrição Estadual', placeholder: 'Opcional' },
                { name: 'email_contabilidade', label: 'Email da Contabilidade', type: 'email', placeholder: 'contabilidade@exemplo.com' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    name={field.name}
                    type={field.type || 'text'}
                    value={formEditar[field.name] || ''}
                    onChange={handleChangeEditar}
                    placeholder={field.placeholder}
                    className={inputCls(errosEdicao[field.name])}
                  />
                  {errosEdicao[field.name] && <p className="text-red-400 text-xs mt-1.5">{errosEdicao[field.name]}</p>}
                </div>
              ))}
              <p className="text-gray-400 dark:text-gray-600 text-xs">CNPJ e Código Interno não podem ser alterados.</p>
              {erroGeralEdicao && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-400/10 border border-red-100 dark:border-red-400/20 rounded-xl px-4 py-3">
                  <span className="text-red-400 text-sm mt-0.5">✕</span>
                  <p className="text-red-600 dark:text-red-400 text-xs">{erroGeralEdicao}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={fecharModalEditar} disabled={salvandoEdicao} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition disabled:opacity-50 px-3 py-2">
                Cancelar
              </button>
              <BtnPrimary onClick={salvarEdicao} disabled={salvandoEdicao}>
                {salvandoEdicao ? 'Salvando…' : 'Salvar alterações'}
              </BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {modalExcluir && (
        <ModalConfirmacao
          titulo="Excluir documento"
          mensagem="Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita."
          onConfirmar={excluirDocumento}
          onCancelar={() => setModalExcluir(null)}
        />
      )}
    </div>
  )
}

// ─── Aba Upload XML ───────────────────────────────────────────────────────────

const STATUS = {
  aguardando:  { bg: 'bg-gray-100 dark:bg-gray-700/60',          text: 'text-gray-500 dark:text-gray-400',   label: 'Aguardando'               },
  validando:   { bg: 'bg-blue-50 dark:bg-blue-400/15',           text: 'text-blue-600 dark:text-blue-400',   label: 'Validando…'               },
  novo:        { bg: 'bg-gray-100 dark:bg-gray-700/60',          text: 'text-gray-700 dark:text-gray-300',   label: '✕ Não existe na base'     },
  existente:   { bg: 'bg-green-50 dark:bg-green-400/15',         text: 'text-green-700 dark:text-green-400', label: '✓ Já existe na base'      },
  divergente:  { bg: 'bg-yellow-50 dark:bg-yellow-400/15',       text: 'text-yellow-700 dark:text-yellow-400', label: '⚠ Valores divergentes'  },
  enviando:    { bg: 'bg-blue-50 dark:bg-blue-400/15',           text: 'text-blue-600 dark:text-blue-400',   label: 'Importando…'              },
  sucesso:     { bg: 'bg-green-50 dark:bg-green-400/15',         text: 'text-green-700 dark:text-green-400', label: '✓ Importado'              },
  erro:        { bg: 'bg-red-50 dark:bg-red-400/15',             text: 'text-red-600 dark:text-red-400',     label: '✕ Erro'                   },
}

function UploadXmlAba({ empresa }) {
  const [arquivos, setArquivos] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [drag, setDrag] = useState(false)
  const [toast, setToast] = useState(null)
  const inputRef = useRef(null)
  const [menuAberto, setMenuAberto] = useState(null)

  const mostrarToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  const adicionarArquivos = async (novos) => {
    const xmls = Array.from(novos).filter(f => f.name.toLowerCase().endsWith('.xml'))
    if (!xmls.length) return

    for (const file of xmls) {
      let jaExiste = false
      setArquivos(prev => {
        jaExiste = !!prev.find(a => a.file.name === file.name)
        return prev
      })
      if (jaExiste) continue

      setArquivos(prev => [...prev, { file, status: 'validando', msg: '', divergencias: [] }])

      try {
        const formData = new FormData()
        formData.append('arquivo', file)
        const res = await api.post(`/documentos/validar-upload/?empresa=${empresa.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        const { status: s, divergencias, cnpj, dados } = res.data

        if (s === 'cnpj_invalido') {
          setArquivos(prev => prev.filter(a => a.file.name !== file.name))
          mostrarToast({ arquivo: file.name, cnpj_xml: cnpj, cnpj_empresa: empresa.cnpj })
        } else {
          setArquivos(prev => prev.map(a =>
            a.file.name === file.name
              ? { ...a, status: s, msg: divergencias?.join(' · ') || '', divergencias: divergencias || [], dados: dados || null }
              : a
          ))
        }
      } catch (err) {
        const detalhe = err.response?.data?.detail || 'Erro ao validar.'
        setArquivos(prev => prev.map(a =>
          a.file.name === file.name ? { ...a, status: 'erro', msg: detalhe } : a
        ))
      }
    }
  }

  const remover = (nome) => { if (enviando) return; setArquivos(prev => prev.filter(a => a.file.name !== nome)) }
  const limpar = () => { if (!enviando) setArquivos([]) }
  const onDrop = (e) => { e.preventDefault(); setDrag(false); adicionarArquivos(e.dataTransfer.files) }

  const importarIndividual = async (arquivo) => {
    setMenuAberto(null)
    setArquivos(prev => prev.map(x =>
      x.file.name === arquivo.file.name ? { ...x, status: 'enviando', msg: '' } : x
    ))
    try {
      const formData = new FormData()
      formData.append('arquivo', arquivo.file)
      await api.post('/documentos/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setArquivos(prev => prev.map(x =>
        x.file.name === arquivo.file.name ? { ...x, status: 'sucesso', msg: 'Importado com sucesso.' } : x
      ))
    } catch (err) {
      const detalhe = err.response?.data?.detail || 'Erro ao importar.'
      setArquivos(prev => prev.map(x =>
        x.file.name === arquivo.file.name ? { ...x, status: 'erro', msg: detalhe } : x
      ))
    }
  }

  const enviarTodos = async () => {
    const pendentes = arquivos.filter(a => a.status === 'novo')
    if (!pendentes.length) return
    setEnviando(true)
    for (const item of pendentes) {
      setArquivos(prev => prev.map(a =>
        a.file.name === item.file.name ? { ...a, status: 'enviando', msg: '' } : a
      ))
      try {
        const formData = new FormData()
        formData.append('arquivo', item.file)
        await api.post('/documentos/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        setArquivos(prev => prev.map(a =>
          a.file.name === item.file.name ? { ...a, status: 'sucesso', msg: 'Importado com sucesso.' } : a
        ))
      } catch (err) {
        const detalhe = err.response?.data?.detail || 'Erro ao importar.'
        setArquivos(prev => prev.map(a =>
          a.file.name === item.file.name ? { ...a, status: 'erro', msg: detalhe } : a
        ))
      }
    }
    setEnviando(false)
  }

  const paraImportar = arquivos.filter(a => a.status === 'novo').length
  const concluidos   = arquivos.filter(a => a.status === 'sucesso').length
  const divergentes  = arquivos.filter(a => a.status === 'divergente').length
  const existentes   = arquivos.filter(a => a.status === 'existente').length
  const validando    = arquivos.some(a => a.status === 'validando')

  return (
    <div className="space-y-4">
      {/* Toast CNPJ divergente */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-500/40 rounded-2xl shadow-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">🚫</span>
            <div className="flex-1">
              <p className="text-gray-900 dark:text-white text-sm font-semibold mb-1">XML de outra empresa</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                O arquivo <span className="text-gray-900 dark:text-white font-mono break-all">{toast.arquivo}</span> não pode ser importado aqui.
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-gray-500 text-xs w-24">CNPJ do XML:</span>
                  <span className="text-red-500 dark:text-red-400 font-mono text-xs">{toast.cnpj_xml}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-gray-500 text-xs w-24">CNPJ esperado:</span>
                  <span className="text-green-600 dark:text-green-400 font-mono text-xs">{toast.cnpj_empresa}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition text-lg leading-none">×</button>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => !enviando && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-8 py-14 cursor-pointer transition-all
          ${drag
            ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-400/5'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/30'}
          ${enviando ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <span className="text-4xl select-none">📂</span>
        <div className="text-center">
          <p className="text-gray-700 dark:text-white text-sm font-medium">Arraste os XMLs aqui</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">ou clique para selecionar arquivos <span className="text-yellow-600 dark:text-yellow-400">.xml</span></p>
        </div>
        <input ref={inputRef} type="file" accept=".xml" multiple className="hidden"
          onChange={(e) => adicionarArquivos(e.target.files)} />
      </div>

      {/* Lista de arquivos */}
      {arquivos.length > 0 && (
        <div className="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-gray-700 dark:text-gray-400 text-sm font-medium">{arquivos.length} arquivo{arquivos.length !== 1 ? 's' : ''}</span>
              {paraImportar > 0 && <span className="text-gray-500 dark:text-gray-400 text-xs">{paraImportar} para importar</span>}
              {concluidos > 0   && <span className="text-green-600 dark:text-green-400 text-xs">{concluidos} importado{concluidos !== 1 ? 's' : ''}</span>}
              {existentes > 0   && <span className="text-green-600 dark:text-green-400 text-xs">{existentes} já existente{existentes !== 1 ? 's' : ''}</span>}
              {divergentes > 0  && <span className="text-yellow-600 dark:text-yellow-400 text-xs">{divergentes} divergente{divergentes !== 1 ? 's' : ''}</span>}
              {validando        && <span className="text-blue-500 dark:text-blue-400 text-xs animate-pulse">Validando…</span>}
            </div>
            <div className="flex items-center gap-2">
              {!enviando && (
                <button onClick={limpar} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-xs transition">
                  Limpar tudo
                </button>
              )}
              <BtnPrimary onClick={enviarTodos} disabled={enviando || paraImportar === 0 || validando}>
                {enviando ? 'Importando…' : paraImportar > 0 ? `Importar ${paraImportar}` : 'Nada para importar'}
              </BtnPrimary>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Série', 'Número', 'Chave', 'Data Emissão', 'Valor', 'Status', 'Detalhe', ''].map(h => (
                  <th key={h} className={`text-gray-400 dark:text-gray-500 text-xs px-5 py-3 font-medium ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {arquivos.map((a) => {
                const s = STATUS[a.status]
                const d = a.dados
                return (
                  <tr key={a.file.name} className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition">
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300 text-xs whitespace-nowrap">{d?.serie ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300 text-xs whitespace-nowrap">{d?.numero_nota ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-gray-400 text-xs font-mono truncate max-w-[180px]" title={d?.chave_acesso ?? a.file.name}>
                      {d?.chave_acesso ?? a.file.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300 text-xs whitespace-nowrap">
                      {d?.data_emissao ? new Date(d.data_emissao + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300 text-xs whitespace-nowrap">
                      {d?.valor_total ? Number(d.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                        {(a.status === 'validando' || a.status === 'enviando') && (
                          <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        )}
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 dark:text-gray-500 text-xs">{a.msg}</td>
                    <td className="px-5 py-3 text-right">
                      {!enviando && a.status !== 'validando' && a.status !== 'enviando' && (
                        <div className="relative inline-block">
                          <button
                            onClick={() => setMenuAberto(menuAberto === a.file.name ? null : a.file.name)}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            ☰
                          </button>
                          {menuAberto === a.file.name && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(null)} />
                              <div className="absolute right-0 top-8 z-50 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                                <button
                                  onClick={() => importarIndividual(a)}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                                >
                                  <span>⬆</span> Importar
                                </button>
                                <div className="border-t border-gray-100 dark:border-gray-700" />
                                <button
                                  onClick={() => { setMenuAberto(null); remover(a.file.name) }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                                >
                                  <span>✕</span> Remover
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-gray-400 dark:text-gray-600 text-xs">
        Somente arquivos com status <span className="text-gray-500 dark:text-gray-400">"Não existe na base"</span> serão importados.
        Arquivos já existentes ou com divergências são ignorados no envio.
      </p>
    </div>
  )
}

// ─── Aba Inconsistências ──────────────────────────────────────────────────────

function InconsistenciasAba({
  empresa,
  arquivoSefaz, setArquivoSefaz, analisando,
  analisarInconsistencias, erroInconsistencia, setErroInconsistencia,
  resultadoInconsistencias, setResultadoInconsistencias,
}) {
  const r = resultadoInconsistencias

  const faltando  = usePagination(r?.faltando_no_sistema)
  const extras    = usePagination(r?.extras_no_sistema)
  const gapsSefaz = usePagination(r?.gaps_sequencia)
  const gapsSist  = usePagination(r?.gaps_sistema)

  const [gerandoXmls, setGerandoXmls] = useState({})
  const [gerandoTodos, setGerandoTodos] = useState(false)

  const card = 'bg-white dark:bg-gray-900/60 rounded-2xl border shadow-sm overflow-hidden'

  const gerarXml = async (notas) => {
    if (!empresa?.id) { alert('Dados da empresa não carregados. Tente novamente.'); return }
    const isTodos = notas.length > 1
    if (isTodos) { setGerandoTodos(true) }
    else { setGerandoXmls(g => ({ ...g, [`${notas[0].numero_nota}-${notas[0].serie}`]: true })) }
    try {
      const res = await api.post('/documentos/gerar-xml/', { empresa_id: empresa.id, notas }, { responseType: 'blob' })
      const contentType = res.headers['content-type'] || ''
      const isZip = contentType.includes('zip')
      const filename = isZip
        ? `xmls_reconstituidos_${empresa.codigo_interno}.zip`
        : `${notas[0].numero_nota}_serie${notas[0].serie}_reconstituido.xml`
      const url = window.URL.createObjectURL(new Blob([res.data], { type: contentType }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      let msg = 'Erro ao gerar XML.'
      try {
        const blob = err.response?.data
        if (blob instanceof Blob) {
          const text = await blob.text()
          msg = JSON.parse(text)?.detail || msg
        }
      } catch {}
      alert(msg)
    } finally {
      if (isTodos) { setGerandoTodos(false) }
      else { setGerandoXmls(g => ({ ...g, [`${notas[0].numero_nota}-${notas[0].serie}`]: false })) }
    }
  }

  const toNotaPayload = (item) => {
    let data = item.data_emissao || ''
    if (data.includes('/')) {
      const [dia, mes, ano] = data.split(' ')[0].split('/')
      data = `${ano}-${mes}-${dia}`
    } else {
      data = data.split('T')[0]
    }
    const valor = parseFloat(String(item.valor_total).replace('.', '').replace(',', '.'))
    return {
      numero_nota: item.numero,
      serie: item.serie,
      valor_total: valor,
      data_emissao: data,
      chave_acesso: item.chave_acesso || null,
      protocolo: item.protocolo || null,
      natureza_operacao: item.natureza_operacao || null,
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload SEFAZ */}
      <div className={`${card} border-gray-200 dark:border-gray-800 p-6`}>
        <p className="text-gray-900 dark:text-white text-sm font-semibold mb-1">Analisar planilha da SEFAZ</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mb-4">
          Importe o arquivo .xls exportado do portal da SEFAZ para verificar inconsistências com os documentos do sistema.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".xls,.xlsx"
            onChange={(e) => { setArquivoSefaz(e.target.files[0]); setResultadoInconsistencias(null); setErroInconsistencia('') }}
            className="flex-1 bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-sm rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-yellow-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-yellow-50 dark:file:bg-yellow-400/10 file:text-yellow-700 dark:file:text-yellow-400 file:text-xs cursor-pointer transition"
          />
          <BtnPrimary onClick={analisarInconsistencias} disabled={analisando || !arquivoSefaz}>
            {analisando ? 'Analisando…' : 'Analisar'}
          </BtnPrimary>
        </div>
        {erroInconsistencia && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-400/10 border border-red-100 dark:border-red-400/20 rounded-xl px-4 py-3 mt-3">
            <span className="text-red-400 text-sm mt-0.5">✕</span>
            <p className="text-red-600 dark:text-red-400 text-xs">{erroInconsistencia}</p>
          </div>
        )}
      </div>

      {r && (
        <div className="space-y-4">
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'Notas na SEFAZ', value: r.total_sefaz, color: null },
              { label: 'Faltando no sistema', value: r.faltando_no_sistema.length, color: r.faltando_no_sistema.length > 0 ? 'red' : 'green' },
              { label: 'Gaps na SEFAZ', value: r.gaps_sequencia.length, color: r.gaps_sequencia.length > 0 ? 'orange' : 'green' },
              { label: 'Gaps no sistema', value: r.gaps_sistema.length, color: r.gaps_sistema.length > 0 ? 'purple' : 'green' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-2xl border p-4 text-center shadow-sm ${
                color === 'red'    ? 'bg-red-50 dark:bg-red-400/5 border-red-200 dark:border-red-400/20' :
                color === 'orange' ? 'bg-orange-50 dark:bg-orange-400/5 border-orange-200 dark:border-orange-400/20' :
                color === 'purple' ? 'bg-purple-50 dark:bg-purple-400/5 border-purple-200 dark:border-purple-400/20' :
                color === 'green'  ? 'bg-green-50 dark:bg-green-400/5 border-green-200 dark:border-green-400/20' :
                'bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-800'
              }`}>
                <p className="text-gray-400 dark:text-gray-500 text-xs mb-1">{label}</p>
                <p className={`text-2xl font-bold ${
                  color === 'red'    ? 'text-red-500 dark:text-red-400' :
                  color === 'orange' ? 'text-orange-500 dark:text-orange-400' :
                  color === 'purple' ? 'text-purple-500 dark:text-purple-400' :
                  color === 'green'  ? 'text-green-600 dark:text-green-400' :
                  'text-gray-900 dark:text-white'
                }`}>{value}</p>
              </div>
            ))}
            <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-gray-400 dark:text-gray-500 text-xs mb-1">Valor total (SEFAZ)</p>
              <p className="text-gray-900 dark:text-white text-lg font-bold">
                {r.valor_total_sefaz ? `R$ ${parseFloat(r.valor_total_sefaz).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
              </p>
            </div>
          </div>

          {/* Tudo ok */}
          {r.faltando_no_sistema.length === 0 && r.extras_no_sistema.length === 0 &&
           r.gaps_sequencia.length === 0 && r.gaps_sistema.length === 0 && (
            <div className="bg-green-50 dark:bg-green-400/5 border border-green-200 dark:border-green-400/20 rounded-2xl p-5 flex items-center gap-3">
              <span className="text-xl">✓</span>
              <p className="text-green-700 dark:text-green-400 text-sm font-medium">Nenhuma inconsistência encontrada! Todos os documentos estão em conformidade.</p>
            </div>
          )}

          {/* Faltando no sistema */}
          {r.faltando_no_sistema.length > 0 && (
            <div className={`${card} border-red-200 dark:border-red-400/20`}>
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <span className="text-red-500 dark:text-red-400 text-sm font-medium">Notas na SEFAZ ausentes no sistema</span>
                <Badge color="red">{r.faltando_no_sistema.length}</Badge>
                <button
                  onClick={() => gerarXml(r.faltando_no_sistema.map(toNotaPayload))}
                  disabled={gerandoTodos}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-300 dark:border-yellow-500/40 text-yellow-700 dark:text-yellow-400 text-xs font-medium bg-transparent hover:bg-yellow-50 dark:hover:bg-yellow-400/10 hover:border-yellow-400 transition-all disabled:opacity-40"
                >
                  {gerandoTodos ? 'Gerando…' : '⬇ Gerar todos os XMLs'}
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Número', 'Série', 'Situação SEFAZ', 'Data Emissão', 'Valor Total', ''].map(h => (
                      <th key={h} className={`text-gray-400 dark:text-gray-500 text-xs px-5 py-3 font-medium ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {faltando.paginados.map((item, i) => {
                    const key = `${item.numero}-${item.serie}`
                    const gerando = gerandoXmls[key]
                    return (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-5 py-3 text-gray-900 dark:text-white font-mono text-sm">{item.numero}</td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-sm">{item.serie}</td>
                        <td className="px-5 py-3"><Badge color={item.situacao === 'Autorizada' ? 'green' : 'red'}>{item.situacao}</Badge></td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-sm">{item.data_emissao}</td>
                        <td className="px-5 py-3 text-gray-900 dark:text-white text-sm">R$ {item.valor_total}</td>
                        <td className="px-5 py-3 text-right">
                          <BtnGhost onClick={() => gerarXml([toNotaPayload(item)])} disabled={gerando || gerandoTodos}>
                            {gerando ? '…' : '⬇ XML'}
                          </BtnGhost>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <PaginacaoTabela pagina={faltando.pagina} totalPaginas={faltando.totalPaginas} setPagina={faltando.setPagina} label={`${r.faltando_no_sistema.length} notas`} />
            </div>
          )}

          {/* Extras no sistema */}
          {r.extras_no_sistema.length > 0 && (
            <div className={`${card} border-yellow-200 dark:border-yellow-400/20`}>
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Notas no sistema ausentes na SEFAZ</span>
                <Badge color="yellow">{r.extras_no_sistema.length}</Badge>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Número', 'Série', 'Status Sistema', 'Chave de Acesso'].map(h => (
                      <th key={h} className="text-left text-gray-400 dark:text-gray-500 text-xs px-5 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {extras.paginados.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-3 text-gray-900 dark:text-white font-mono text-sm">{item.numero}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-sm">{item.serie}</td>
                      <td className="px-5 py-3"><Badge color={item.status === 'autorizado' ? 'green' : 'red'}>{item.status}</Badge></td>
                      <td className="px-5 py-3 text-gray-400 dark:text-gray-500 text-xs font-mono">{item.chave_acesso}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginacaoTabela pagina={extras.pagina} totalPaginas={extras.totalPaginas} setPagina={extras.setPagina} label={`${r.extras_no_sistema.length} notas`} />
            </div>
          )}

          {/* Gaps SEFAZ */}
          {r.gaps_sequencia.length > 0 && (
            <div className={`${card} border-orange-200 dark:border-orange-400/20`}>
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">Gaps na sequência numérica da SEFAZ</span>
                <Badge color="orange">{r.gaps_sequencia.length}</Badge>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Série', 'Número faltante', 'Entre as notas'].map(h => (
                      <th key={h} className="text-left text-gray-400 dark:text-gray-500 text-xs px-5 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gapsSefaz.paginados.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-sm">{item.serie}</td>
                      <td className="px-5 py-3 text-orange-600 dark:text-orange-400 font-mono font-medium text-sm">{item.numero}</td>
                      <td className="px-5 py-3 text-gray-400 dark:text-gray-500 text-sm">{item.entre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginacaoTabela pagina={gapsSefaz.pagina} totalPaginas={gapsSefaz.totalPaginas} setPagina={gapsSefaz.setPagina} label={`${r.gaps_sequencia.length} gaps`} />
            </div>
          )}

          {/* Gaps Sistema */}
          {r.gaps_sistema.length > 0 && (
            <div className={`${card} border-purple-200 dark:border-purple-400/20`}>
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">Gaps na sequência numérica do sistema</span>
                <Badge color="purple">{r.gaps_sistema.length}</Badge>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Série', 'Número faltante', 'Entre as notas'].map(h => (
                      <th key={h} className="text-left text-gray-400 dark:text-gray-500 text-xs px-5 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gapsSist.paginados.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-sm">{item.serie}</td>
                      <td className="px-5 py-3 text-purple-600 dark:text-purple-400 font-mono font-medium text-sm">{item.numero}</td>
                      <td className="px-5 py-3 text-gray-400 dark:text-gray-500 text-sm">{item.entre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginacaoTabela pagina={gapsSist.pagina} totalPaginas={gapsSist.totalPaginas} setPagina={gapsSist.setPagina} label={`${r.gaps_sistema.length} gaps`} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EmpresaDetalhe
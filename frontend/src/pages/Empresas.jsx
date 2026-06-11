import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

const campoInicial = {
  cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  inscricao_estadual: '',
  codigo_interno: '',
  email_contabilidade: '',
}

function Empresas() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()
  const porPagina = 20

  // Modal
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(campoInicial)
  const [certArquivo, setCertArquivo] = useState(null)
  const [certSenha, setCertSenha] = useState('')
  const [mostrarSenhaCert, setMostrarSenhaCert] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')

  // Busca CNPJ
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [erroCnpj, setErroCnpj] = useState('')

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

  const abrirModal = () => {
    setForm(campoInicial)
    setCertArquivo(null)
    setCertSenha('')
    setErros({})
    setErroGeral('')
    setErroCnpj('')
    setModalAberto(true)
  }

  const fecharModal = () => {
    if (salvando) return
    setModalAberto(false)
  }

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErros(er => ({ ...er, [e.target.name]: '' }))
    if (e.target.name === 'cnpj') setErroCnpj('')
  }

  const buscarCnpj = async () => {
    const cnpjLimpo = form.cnpj.replace(/\D/g, '')
    if (cnpjLimpo.length !== 14) {
      setErroCnpj('Digite um CNPJ completo (14 dígitos) antes de buscar.')
      return
    }
    setBuscandoCnpj(true)
    setErroCnpj('')
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`)
      if (!res.ok) {
        setErroCnpj('CNPJ não encontrado na Receita Federal.')
        return
      }
      const data = await res.json()
      setForm(f => ({
        ...f,
        razao_social: data.razao_social || '',
        nome_fantasia: data.nome_fantasia || data.razao_social || '',
        inscricao_estadual: '',
      }))
      setErros(er => ({ ...er, razao_social: '', nome_fantasia: '' }))
    } catch {
      setErroCnpj('Erro ao consultar o CNPJ. Verifique sua conexão.')
    } finally {
      setBuscandoCnpj(false)
    }
  }

  const salvar = async () => {
    setSalvando(true)
    setErros({})
    setErroGeral('')
    try {
      const res = await api.post('/empresas/', form)
      const novaEmpresa = res.data
      if (certArquivo && certSenha) {
        const formData = new FormData()
        formData.append('certificado_pfx', certArquivo)
        formData.append('senha', certSenha)
        try {
          await api.patch(`/empresas/${novaEmpresa.codigo_interno}/certificado/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        } catch {
          setErroGeral('Empresa criada, mas houve erro ao salvar o certificado. Você pode adicioná-lo depois.')
          await carregarEmpresas(pagina)
          setSalvando(false)
          return
        }
      }
      setModalAberto(false)
      await carregarEmpresas(pagina)
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data
        const camposConhecidos = ['cnpj', 'razao_social', 'nome_fantasia', 'inscricao_estadual', 'codigo_interno', 'email_contabilidade']
        const novosErros = {}
        camposConhecidos.forEach(campo => {
          if (data[campo]) novosErros[campo] = Array.isArray(data[campo]) ? data[campo][0] : data[campo]
        })
        if (Object.keys(novosErros).length > 0) {
          setErros(novosErros)
        } else {
          setErroGeral(data.detail || 'Erro ao cadastrar empresa.')
        }
      } else {
        setErroGeral('Erro de conexão.')
      }
    } finally {
      setSalvando(false)
    }
  }

  // Iniciais para avatar
  const getIniciais = (nome) => {
    const palavras = nome?.trim().split(' ') || []
    if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase()
    return (palavras[0][0] + palavras[1][0]).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-gray-900 dark:text-white text-2xl font-bold tracking-tight">
              Empresas
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {total} empresa{total !== 1 ? 's' : ''} cadastrada{total !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={abrirModal}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-150 shadow-sm"
          >
            <span className="text-base leading-none">+</span>
            Nova Empresa
          </button>
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CNPJ ou código interno..."
            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-yellow-400 dark:focus:border-yellow-400 text-sm transition-colors duration-150 placeholder-gray-400 dark:placeholder-gray-600 shadow-sm"
          />
        </div>

        {/* Cards */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">

          {/* Header do card-list */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Todas as empresas
            </span>
            <span className="bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 text-xs font-semibold px-2.5 py-1 rounded-full">
              {empresasFiltradas.length}
            </span>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="py-16 text-center text-gray-400 dark:text-gray-600 text-sm">
              Carregando...
            </div>
          ) : empresasFiltradas.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-gray-300 dark:text-gray-700 text-4xl mb-3">🏢</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma empresa encontrada</p>
            </div>
          ) : (
            empresasFiltradas.map((empresa, idx) => (
              <div
                key={empresa.id}
                onClick={() => navigate(`/empresas/${empresa.codigo_interno}`)}
                className={`
                  flex items-center gap-4 px-5 py-4 cursor-pointer
                  hover:bg-gray-50 dark:hover:bg-gray-800/60
                  active:bg-gray-100 dark:active:bg-gray-800
                  transition-colors duration-100
                  ${idx !== empresasFiltradas.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}
                `}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wide">
                    {getIniciais(empresa.nome_fantasia)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {empresa.nome_fantasia}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    #{empresa.codigo_interno} · {empresa.cnpj.replace(/\D/g, '').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                  </p>
                </div>

                {/* Status */}
                {empresa.desativado ? (
                  <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-400/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-transparent">
                    Inativa
                  </span>
                ) : (
                  <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-400/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-transparent">
                    Ativa
                  </span>
                )}

                {/* Chevron */}
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" />
                </svg>
              </div>
            ))
          )}
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Página {pagina} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="bg-white dark:bg-gray-900 text-gray-700 dark:text-white text-sm px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-yellow-400 dark:hover:border-yellow-400 transition-colors disabled:opacity-40 shadow-sm"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="bg-white dark:bg-gray-900 text-gray-700 dark:text-white text-sm px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-yellow-400 dark:hover:border-yellow-400 transition-colors disabled:opacity-40 shadow-sm"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nova Empresa */}
      {modalAberto && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/75 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
          onClick={fecharModal}
        >
          <div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-gray-900 dark:text-white font-semibold text-base">Nova Empresa</h2>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Preencha os dados para cadastrar</p>
              </div>
              <button
                onClick={fecharModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* Campo reutilizável — CNPJ + lupa */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  CNPJ <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    name="cnpj"
                    value={form.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    className={`flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 border text-sm focus:outline-none transition-colors ${
                      erros.cnpj
                        ? 'border-red-400 focus:border-red-400'
                        : 'border-gray-200 dark:border-gray-700 focus:border-yellow-400'
                    }`}
                  />
                  <button
                    onClick={buscarCnpj}
                    disabled={buscandoCnpj}
                    title="Buscar dados do CNPJ"
                    className="bg-gray-50 dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 border border-gray-200 dark:border-gray-700 hover:border-yellow-400 px-3.5 py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
                  >
                    {buscandoCnpj ? (
                      <span className="inline-block w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {erroCnpj && <p className="text-red-400 text-xs mt-1.5">{erroCnpj}</p>}
                {erros.cnpj && <p className="text-red-400 text-xs mt-1.5">{erros.cnpj}</p>}
              </div>

              {/* Código Interno */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Código Interno <span className="text-red-400">*</span>
                </label>
                <input
                  name="codigo_interno"
                  value={form.codigo_interno}
                  onChange={handleChange}
                  placeholder="Ex: 64004"
                  className={`w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 border text-sm focus:outline-none transition-colors ${
                    erros.codigo_interno
                      ? 'border-red-400'
                      : 'border-gray-200 dark:border-gray-700 focus:border-yellow-400'
                  }`}
                />
                {erros.codigo_interno && <p className="text-red-400 text-xs mt-1.5">{erros.codigo_interno}</p>}
              </div>

              {/* Razão Social */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Razão Social <span className="text-red-400">*</span>
                </label>
                <input
                  name="razao_social"
                  value={form.razao_social}
                  onChange={handleChange}
                  placeholder="Preenchido automaticamente pela busca"
                  className={`w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 border text-sm focus:outline-none transition-colors ${
                    erros.razao_social
                      ? 'border-red-400'
                      : 'border-gray-200 dark:border-gray-700 focus:border-yellow-400'
                  }`}
                />
                {erros.razao_social && <p className="text-red-400 text-xs mt-1.5">{erros.razao_social}</p>}
              </div>

              {/* Nome Fantasia */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Nome Fantasia <span className="text-red-400">*</span>
                </label>
                <input
                  name="nome_fantasia"
                  value={form.nome_fantasia}
                  onChange={handleChange}
                  placeholder="Preenchido automaticamente pela busca"
                  className={`w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 border text-sm focus:outline-none transition-colors ${
                    erros.nome_fantasia
                      ? 'border-red-400'
                      : 'border-gray-200 dark:border-gray-700 focus:border-yellow-400'
                  }`}
                />
                {erros.nome_fantasia && <p className="text-red-400 text-xs mt-1.5">{erros.nome_fantasia}</p>}
              </div>

              {/* Inscrição Estadual */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Inscrição Estadual
                </label>
                <input
                  name="inscricao_estadual"
                  value={form.inscricao_estadual}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-yellow-400 text-sm transition-colors"
                />
              </div>

              {/* Email Contabilidade */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Email da Contabilidade
                </label>
                <input
                  name="email_contabilidade"
                  type="email"
                  value={form.email_contabilidade}
                  onChange={handleChange}
                  placeholder="contabilidade@exemplo.com"
                  className={`w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 border text-sm focus:outline-none transition-colors ${
                    erros.email_contabilidade
                      ? 'border-red-400'
                      : 'border-gray-200 dark:border-gray-700 focus:border-yellow-400'
                  }`}
                />
                {erros.email_contabilidade && <p className="text-red-400 text-xs mt-1.5">{erros.email_contabilidade}</p>}
              </div>

              {/* Certificado Digital */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Certificado Digital A1</p>
                  <span className="text-xs text-gray-400 dark:text-gray-600">opcional</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 dark:text-gray-500 mb-1.5 block">Arquivo .pfx</label>
                    <input
                      type="file"
                      accept=".pfx,.p12"
                      onChange={(e) => setCertArquivo(e.target.files[0])}
                      className="w-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-yellow-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-yellow-50 dark:file:bg-yellow-400/10 file:text-yellow-700 dark:file:text-yellow-400 file:text-xs cursor-pointer"
                    />
                  </div>
                  {certArquivo && (
                    <div>
                      <label className="text-xs text-gray-400 dark:text-gray-500 mb-1.5 block">Senha do certificado</label>
                      <div className="flex items-center gap-2">
                        <input
                          type={mostrarSenhaCert ? 'text' : 'password'}
                          value={certSenha}
                          onChange={(e) => setCertSenha(e.target.value)}
                          placeholder="Senha do .pfx"
                          className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-yellow-400 text-sm"
                        />
                        <button
                          onClick={() => setMostrarSenhaCert(!mostrarSenhaCert)}
                          className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors whitespace-nowrap px-1"
                        >
                          {mostrarSenhaCert ? 'Ocultar' : 'Revelar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {erroGeral && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-400/10 border border-red-100 dark:border-red-400/20 rounded-xl px-4 py-3">
                  <span className="text-red-400 text-sm mt-0.5">✕</span>
                  <p className="text-red-600 dark:text-red-400 text-xs">{erroGeral}</p>
                </div>
              )}
            </div>

            {/* Footer do modal */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={fecharModal}
                disabled={salvando}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors disabled:opacity-50 px-3 py-2"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
              >
                {salvando ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Empresas
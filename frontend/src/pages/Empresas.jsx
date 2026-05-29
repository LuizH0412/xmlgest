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
        inscricao_estadual: '', // Brasil API não retorna IE
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

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Empresas</h1>
            <p className="text-gray-400 mt-1">{total} empresa{total !== 1 ? 's' : ''} cadastrada{total !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={abrirModal}
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Nova Empresa
          </button>
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
                <tr><td colSpan={4} className="text-center text-gray-400 py-8">Carregando...</td></tr>
              ) : empresasFiltradas.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-gray-400 py-8">Nenhuma empresa encontrada</td></tr>
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

      {/* Modal Nova Empresa */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-white font-semibold text-lg">Nova Empresa</h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-white transition text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-4">

              {/* CNPJ + lupa */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">CNPJ <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <input
                    name="cnpj"
                    value={form.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    className={`flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 border focus:outline-none text-sm transition ${erros.cnpj ? 'border-red-400' : 'border-gray-700 focus:border-yellow-400'}`}
                  />
                  <button
                    onClick={buscarCnpj}
                    disabled={buscandoCnpj}
                    title="Buscar dados do CNPJ"
                    className="bg-gray-800 hover:bg-yellow-400/10 text-yellow-400 border border-gray-700 hover:border-yellow-400 px-3 py-2 rounded-lg transition disabled:opacity-50 text-sm"
                  >
                    {buscandoCnpj ? '...' : '🔍'}
                  </button>
                </div>
                {erroCnpj && <p className="text-red-400 text-xs mt-1">{erroCnpj}</p>}
                {erros.cnpj && <p className="text-red-400 text-xs mt-1">{erros.cnpj}</p>}
              </div>

              {/* Código Interno */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Código Interno <span className="text-red-400">*</span></label>
                <input
                  name="codigo_interno"
                  value={form.codigo_interno}
                  onChange={handleChange}
                  placeholder="Ex: 64004"
                  className={`w-full bg-gray-800 text-white rounded-lg px-3 py-2 border focus:outline-none text-sm transition ${erros.codigo_interno ? 'border-red-400' : 'border-gray-700 focus:border-yellow-400'}`}
                />
                {erros.codigo_interno && <p className="text-red-400 text-xs mt-1">{erros.codigo_interno}</p>}
              </div>

              {/* Razão Social */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Razão Social <span className="text-red-400">*</span></label>
                <input
                  name="razao_social"
                  value={form.razao_social}
                  onChange={handleChange}
                  placeholder="Preenchido automaticamente pela lupa"
                  className={`w-full bg-gray-800 text-white rounded-lg px-3 py-2 border focus:outline-none text-sm transition ${erros.razao_social ? 'border-red-400' : 'border-gray-700 focus:border-yellow-400'}`}
                />
                {erros.razao_social && <p className="text-red-400 text-xs mt-1">{erros.razao_social}</p>}
              </div>

              {/* Nome Fantasia */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Nome Fantasia <span className="text-red-400">*</span></label>
                <input
                  name="nome_fantasia"
                  value={form.nome_fantasia}
                  onChange={handleChange}
                  placeholder="Preenchido automaticamente pela lupa"
                  className={`w-full bg-gray-800 text-white rounded-lg px-3 py-2 border focus:outline-none text-sm transition ${erros.nome_fantasia ? 'border-red-400' : 'border-gray-700 focus:border-yellow-400'}`}
                />
                {erros.nome_fantasia && <p className="text-red-400 text-xs mt-1">{erros.nome_fantasia}</p>}
              </div>

              {/* Inscrição Estadual */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Inscrição Estadual</label>
                <input
                  name="inscricao_estadual"
                  value={form.inscricao_estadual}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-yellow-400 text-sm transition"
                />
              </div>

              {/* Email Contabilidade */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Email da Contabilidade</label>
                <input
                  name="email_contabilidade"
                  type="email"
                  value={form.email_contabilidade}
                  onChange={handleChange}
                  placeholder="contabilidade@exemplo.com"
                  className={`w-full bg-gray-800 text-white rounded-lg px-3 py-2 border focus:outline-none text-sm transition ${erros.email_contabilidade ? 'border-red-400' : 'border-gray-700 focus:border-yellow-400'}`}
                />
                {erros.email_contabilidade && <p className="text-red-400 text-xs mt-1">{erros.email_contabilidade}</p>}
              </div>

              {/* Certificado */}
              <div className="border-t border-gray-800 pt-4">
                <p className="text-gray-400 text-xs mb-3">Certificado Digital A1 <span className="text-gray-600">(opcional, pode adicionar depois)</span></p>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Arquivo .pfx</label>
                    <input
                      type="file"
                      accept=".pfx,.p12"
                      onChange={(e) => setCertArquivo(e.target.files[0])}
                      className="w-full bg-gray-800 text-gray-300 text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-yellow-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-yellow-400/10 file:text-yellow-400 file:text-xs cursor-pointer"
                    />
                  </div>
                  {certArquivo && (
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Senha do certificado</label>
                      <div className="flex items-center gap-2">
                        <input
                          type={mostrarSenhaCert ? 'text' : 'password'}
                          value={certSenha}
                          onChange={(e) => setCertSenha(e.target.value)}
                          placeholder="Senha do .pfx"
                          className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-yellow-400 text-sm"
                        />
                        <button
                          onClick={() => setMostrarSenhaCert(!mostrarSenhaCert)}
                          className="text-gray-400 hover:text-white text-xs transition whitespace-nowrap"
                        >
                          {mostrarSenhaCert ? 'Ocultar' : 'Revelar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {erroGeral && <p className="text-red-400 text-xs">❌ {erroGeral}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
              <button onClick={fecharModal} disabled={salvando} className="text-gray-400 hover:text-white text-sm transition disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando} className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50">
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
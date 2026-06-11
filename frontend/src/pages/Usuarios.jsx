import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const perfilLabel = {
  admin: 'Admin',
  supervisao: 'Supervisão',
  pev: 'PEV',
}

const perfilCores = {
  admin: 'bg-yellow-50 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-transparent',
  supervisao: 'bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-transparent',
  pev: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-transparent',
}

const campoInicial = {
  nome: '',
  email: '',
  perfil: 'pev',
  password: '',
}

const inputClass = (erro) =>
  `w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 border text-sm focus:outline-none transition-colors ${
    erro
      ? 'border-red-400 focus:border-red-400'
      : 'border-gray-200 dark:border-gray-700 focus:border-yellow-400'
  }`

function Campo({ label, obrigatorio, erro, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
        {label} {obrigatorio && <span className="text-red-400">*</span>}
      </label>
      {children}
      {erro && <p className="text-red-400 text-xs mt-1.5">{erro}</p>}
    </div>
  )
}

function Usuarios() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  // Modal criar
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(campoInicial)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')

  // Modal editar
  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [formEditar, setFormEditar] = useState({})
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [errosEdicao, setErrosEdicao] = useState({})
  const [erroGeralEdicao, setErroGeralEdicao] = useState('')

  // Desativar
  const [confirmarDesativar, setConfirmarDesativar] = useState(null)
  const [desativando, setDesativando] = useState(false)

  const carregarUsuarios = async () => {
    setLoading(true)
    try {
      const res = await api.get('/usuarios/')
      setUsuarios(res.data.results ?? res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const usuariosFiltrados = usuarios.filter(u =>
    u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    u.email?.toLowerCase().includes(busca.toLowerCase())
  )

  // Criar
  const abrirModal = () => {
    setForm(campoInicial)
    setErros({})
    setErroGeral('')
    setMostrarSenha(false)
    setModalAberto(true)
  }

  const fecharModal = () => {
    if (salvando) return
    setModalAberto(false)
  }

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErros(er => ({ ...er, [e.target.name]: '' }))
  }

  const salvar = async () => {
    setSalvando(true)
    setErros({})
    setErroGeral('')
    try {
      await api.post('/usuarios/', form)
      setModalAberto(false)
      await carregarUsuarios()
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data
        const camposConhecidos = ['nome', 'email', 'perfil', 'password']
        const novosErros = {}
        camposConhecidos.forEach(campo => {
          if (data[campo]) novosErros[campo] = Array.isArray(data[campo]) ? data[campo][0] : data[campo]
        })
        if (Object.keys(novosErros).length > 0) setErros(novosErros)
        else setErroGeral(data.detail || 'Erro ao cadastrar usuário.')
      } else {
        setErroGeral('Erro de conexão.')
      }
    } finally {
      setSalvando(false)
    }
  }

  // Editar
  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario)
    setFormEditar({ nome: usuario.nome || '', perfil: usuario.perfil || 'pev' })
    setErrosEdicao({})
    setErroGeralEdicao('')
    setModalEditarAberto(true)
  }

  const fecharModalEditar = () => {
    if (salvandoEdicao) return
    setModalEditarAberto(false)
  }

  const handleChangeEditar = (e) => {
    setFormEditar(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrosEdicao(er => ({ ...er, [e.target.name]: '' }))
  }

  const salvarEdicao = async () => {
    setSalvandoEdicao(true)
    setErrosEdicao({})
    setErroGeralEdicao('')
    try {
      await api.patch(`/usuarios/${usuarioEditando.id}/`, formEditar)
      setModalEditarAberto(false)
      await carregarUsuarios()
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data
        const novosErros = {}
        ;['nome', 'perfil'].forEach(campo => {
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

  // Desativar / Reativar
  const toggleDesativar = async (usuario) => {
    setDesativando(true)
    try {
      await api.patch(`/usuarios/${usuario.id}/`, { desativado: !usuario.desativado })
      setConfirmarDesativar(null)
      await carregarUsuarios()
    } catch {
      alert('Erro ao alterar status do usuário.')
    } finally {
      setDesativando(false)
    }
  }

  const getIniciais = (nome) => {
    const palavras = nome?.trim().split(' ') || []
    if (!palavras[0]) return '?'
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
            <h1 className="text-gray-900 dark:text-white text-2xl font-bold tracking-tight">Usuários</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} cadastrado{usuarios.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={abrirModal}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-150 shadow-sm"
          >
            <span className="text-base leading-none">+</span>
            Novo Usuário
          </button>
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-yellow-400 text-sm transition-colors placeholder-gray-400 dark:placeholder-gray-600 shadow-sm"
          />
        </div>

        {/* Lista */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">

          {/* Header da lista */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Todos os usuários</span>
            <span className="bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 text-xs font-semibold px-2.5 py-1 rounded-full">
              {usuariosFiltrados.length}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400 dark:text-gray-600 text-sm">Carregando...</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-gray-300 dark:text-gray-700 text-4xl mb-3">👤</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum usuário encontrado</p>
            </div>
          ) : (
            usuariosFiltrados.map((u, idx) => (
              <div
                key={u.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors duration-100 ${
                  idx !== usuariosFiltrados.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wide">
                    {getIniciais(u.nome)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {u.nome || <span className="text-gray-400 dark:text-gray-600 font-normal italic">Sem nome</span>}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{u.email}</p>
                </div>

                {/* Perfil */}
                <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${perfilCores[u.perfil] ?? perfilCores.pev}`}>
                  {perfilLabel[u.perfil] ?? u.perfil}
                </span>

                {/* Status */}
                {u.desativado ? (
                  <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-400/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-transparent">
                    Inativo
                  </span>
                ) : (
                  <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-400/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-transparent">
                    Ativo
                  </span>
                )}

                {/* Ações */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  {confirmarDesativar === u.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        {u.desativado ? 'Reativar?' : 'Desativar?'}
                      </span>
                      <button
                        onClick={() => toggleDesativar(u)}
                        disabled={desativando}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
                          u.desativado
                            ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-400/20 hover:bg-green-50 dark:hover:bg-green-400/10'
                            : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-400/20 hover:bg-red-50 dark:hover:bg-red-400/10'
                        }`}
                      >
                        {desativando ? '...' : 'Sim'}
                      </button>
                      <button
                        onClick={() => setConfirmarDesativar(null)}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white px-2 py-1 transition-colors"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => abrirModalEditar(u)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 px-2.5 py-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-400/10 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 0 1 2.828 2.828L11.828 15.828a2 2 0 0 1-1.414.586H8v-2.414a2 2 0 0 1 .586-1.414z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmarDesativar(u.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                          u.desativado
                            ? 'text-gray-400 dark:text-gray-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-400/10'
                            : 'text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10'
                        }`}
                      >
                        {u.desativado ? 'Reativar' : 'Desativar'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Novo Usuário */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 flex items-center justify-center z-50 px-4 backdrop-blur-sm" onClick={fecharModal}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-gray-900 dark:text-white font-semibold text-base">Novo Usuário</h2>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Preencha os dados para cadastrar</p>
              </div>
              <button onClick={fecharModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <Campo label="Nome" obrigatorio erro={erros.nome}>
                <input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome completo" className={inputClass(erros.nome)} />
              </Campo>

              <Campo label="Email" obrigatorio erro={erros.email}>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="usuario@exemplo.com" className={inputClass(erros.email)} />
              </Campo>

              <Campo label="Perfil" obrigatorio erro={erros.perfil}>
                <select name="perfil" value={form.perfil} onChange={handleChange} className={inputClass(erros.perfil)}>
                  <option value="pev">PEV</option>
                  <option value="supervisao">Supervisão</option>
                  <option value="admin">Admin</option>
                </select>
              </Campo>

              <Campo label="Senha" obrigatorio erro={erros.password}>
                <div className="flex items-center gap-2">
                  <input
                    name="password"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Senha de acesso"
                    className={inputClass(erros.password) + ' flex-1 w-auto'}
                    style={{ width: 'auto' }}
                  />
                  <button onClick={() => setMostrarSenha(!mostrarSenha)} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors whitespace-nowrap px-1">
                    {mostrarSenha ? 'Ocultar' : 'Revelar'}
                  </button>
                </div>
              </Campo>

              {erroGeral && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-400/10 border border-red-100 dark:border-red-400/20 rounded-xl px-4 py-3">
                  <span className="text-red-400 text-sm mt-0.5">✕</span>
                  <p className="text-red-600 dark:text-red-400 text-xs">{erroGeral}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={fecharModal} disabled={salvando} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors disabled:opacity-50 px-3 py-2">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm">
                {salvando ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuário */}
      {modalEditarAberto && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 flex items-center justify-center z-50 px-4 backdrop-blur-sm" onClick={fecharModalEditar}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-gray-900 dark:text-white font-semibold text-base">Editar Usuário</h2>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{usuarioEditando?.email}</p>
              </div>
              <button onClick={fecharModalEditar} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <Campo label="Nome" erro={errosEdicao.nome}>
                <input name="nome" value={formEditar.nome} onChange={handleChangeEditar} className={inputClass(errosEdicao.nome)} />
              </Campo>

              <Campo label="Perfil" erro={errosEdicao.perfil}>
                <select name="perfil" value={formEditar.perfil} onChange={handleChangeEditar} className={inputClass(errosEdicao.perfil)}>
                  <option value="pev">PEV</option>
                  <option value="supervisao">Supervisão</option>
                  <option value="admin">Admin</option>
                </select>
              </Campo>

              <p className="text-xs text-gray-400 dark:text-gray-600">O email não pode ser alterado.</p>

              {erroGeralEdicao && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-400/10 border border-red-100 dark:border-red-400/20 rounded-xl px-4 py-3">
                  <span className="text-red-400 text-sm mt-0.5">✕</span>
                  <p className="text-red-600 dark:text-red-400 text-xs">{erroGeralEdicao}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={fecharModalEditar} disabled={salvandoEdicao} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors disabled:opacity-50 px-3 py-2">Cancelar</button>
              <button onClick={salvarEdicao} disabled={salvandoEdicao} className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm">
                {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Usuarios
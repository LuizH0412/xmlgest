import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const perfilLabel = {
  admin: 'Admin',
  supervisao: 'Supervisão',
  pev: 'PEV',
}

const campoInicial = {
  nome: '',
  email: '',
  perfil: 'pev',
  password: '',
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

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Usuários</h1>
            <p className="text-gray-400 mt-1">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} cadastrado{usuarios.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={abrirModal}
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Novo Usuário
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 border border-gray-800 focus:outline-none focus:border-yellow-400 transition"
          />
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Nome</th>
                <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Email</th>
                <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Perfil</th>
                <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Status</th>
                <th className="text-right text-gray-400 text-sm px-6 py-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">Carregando...</td></tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">Nenhum usuário encontrado</td></tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4 text-white font-medium">{u.nome || '—'}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        u.perfil === 'admin' ? 'bg-yellow-400/10 text-yellow-400' :
                        u.perfil === 'supervisao' ? 'bg-blue-400/10 text-blue-400' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {perfilLabel[u.perfil] ?? u.perfil}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.desativado ? (
                        <span className="bg-red-400/10 text-red-400 text-xs px-2 py-1 rounded-full">Inativo</span>
                      ) : (
                        <span className="bg-green-400/10 text-green-400 text-xs px-2 py-1 rounded-full">Ativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {confirmarDesativar === u.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs">{u.desativado ? 'Reativar?' : 'Desativar?'}</span>
                            <button
                              onClick={() => toggleDesativar(u)}
                              disabled={desativando}
                              className={`text-xs font-medium px-2 py-1 rounded transition disabled:opacity-50 ${
                                u.desativado ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'
                              }`}
                            >
                              {desativando ? '...' : 'Sim'}
                            </button>
                            <button
                              onClick={() => setConfirmarDesativar(null)}
                              className="text-xs text-gray-400 hover:text-white transition"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => abrirModalEditar(u)}
                              className="text-xs text-gray-400 hover:text-yellow-400 transition"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => setConfirmarDesativar(u.id)}
                              className={`text-xs transition ${u.desativado ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}`}
                            >
                              {u.desativado ? 'Reativar' : 'Desativar'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Usuário */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={fecharModal}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-white font-semibold text-lg">Novo Usuário</h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-white transition text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Nome <span className="text-red-400">*</span></label>
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Nome completo"
                  className={`w-full bg-gray-800 text-white rounded-lg px-3 py-2 border focus:outline-none text-sm transition ${erros.nome ? 'border-red-400' : 'border-gray-700 focus:border-yellow-400'}`}
                />
                {erros.nome && <p className="text-red-400 text-xs mt-1">{erros.nome}</p>}
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Email <span className="text-red-400">*</span></label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="usuario@exemplo.com"
                  className={`w-full bg-gray-800 text-white rounded-lg px-3 py-2 border focus:outline-none text-sm transition ${erros.email ? 'border-red-400' : 'border-gray-700 focus:border-yellow-400'}`}
                />
                {erros.email && <p className="text-red-400 text-xs mt-1">{erros.email}</p>}
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Perfil <span className="text-red-400">*</span></label>
                <select
                  name="perfil"
                  value={form.perfil}
                  onChange={handleChange}
                  className={`w-full bg-gray-800 text-white rounded-lg px-3 py-2 border focus:outline-none text-sm transition ${erros.perfil ? 'border-red-400' : 'border-gray-700 focus:border-yellow-400'}`}
                >
                  <option value="pev">PEV</option>
                  <option value="supervisao">Supervisão</option>
                  <option value="admin">Admin</option>
                </select>
                {erros.perfil && <p className="text-red-400 text-xs mt-1">{erros.perfil}</p>}
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Senha <span className="text-red-400">*</span></label>
                <div className="flex items-center gap-2">
                  <input
                    name="password"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Senha de acesso"
                    className={`flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 border focus:outline-none text-sm transition ${erros.password ? 'border-red-400' : 'border-gray-700 focus:border-yellow-400'}`}
                  />
                  <button onClick={() => setMostrarSenha(!mostrarSenha)} className="text-gray-400 hover:text-white text-xs transition whitespace-nowrap">
                    {mostrarSenha ? 'Ocultar' : 'Revelar'}
                  </button>
                </div>
                {erros.password && <p className="text-red-400 text-xs mt-1">{erros.password}</p>}
              </div>

              {erroGeral && <p className="text-red-400 text-xs">❌ {erroGeral}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
              <button onClick={fecharModal} disabled={salvando} className="text-gray-400 hover:text-white text-sm transition disabled:opacity-50">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50">
                {salvando ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuário */}
      {modalEditarAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={fecharModalEditar}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-white font-semibold text-lg">Editar Usuário</h2>
              <button onClick={fecharModalEditar} className="text-gray-400 hover:text-white transition text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Nome</label>
                <input
                  name="nome"
                  value={formEditar.nome}
                  onChange={handleChangeEditar}
                  className={`w-full bg-gray-800 text-white rounded-lg px-3 py-2 border focus:outline-none text-sm transition ${errosEdicao.nome ? 'border-red-400' : 'border-gray-700 focus:border-yellow-400'}`}
                />
                {errosEdicao.nome && <p className="text-red-400 text-xs mt-1">{errosEdicao.nome}</p>}
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Perfil</label>
                <select
                  name="perfil"
                  value={formEditar.perfil}
                  onChange={handleChangeEditar}
                  className={`w-full bg-gray-800 text-white rounded-lg px-3 py-2 border focus:outline-none text-sm transition ${errosEdicao.perfil ? 'border-red-400' : 'border-gray-700 focus:border-yellow-400'}`}
                >
                  <option value="pev">PEV</option>
                  <option value="supervisao">Supervisão</option>
                  <option value="admin">Admin</option>
                </select>
                {errosEdicao.perfil && <p className="text-red-400 text-xs mt-1">{errosEdicao.perfil}</p>}
              </div>

              <p className="text-gray-600 text-xs">Email não pode ser alterado.</p>
              {erroGeralEdicao && <p className="text-red-400 text-xs">❌ {erroGeralEdicao}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
              <button onClick={fecharModalEditar} disabled={salvandoEdicao} className="text-gray-400 hover:text-white text-sm transition disabled:opacity-50">Cancelar</button>
              <button onClick={salvarEdicao} disabled={salvandoEdicao} className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50">
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
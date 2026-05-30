import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path
  const podeVerUsuarios = ['admin', 'supervisao'].includes(user?.perfil)

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-yellow-400 text-xl">📁</span>
        <span className="text-white font-bold text-lg">FiscalHub</span>
        <span className="text-gray-500 text-sm ml-1">by Softcom</span>
      </div>

      {/* Links */}
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className={`text-sm font-medium transition ${isActive('/') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}
        >
          Dashboard
        </Link>
        <Link
          to="/empresas"
          className={`text-sm font-medium transition ${isActive('/empresas') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}
        >
          Empresas
        </Link>
        {podeVerUsuarios && (
          <Link
            to="/usuarios"
            className={`text-sm font-medium transition ${isActive('/usuarios') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}
          >
            Usuários
          </Link>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="text-sm text-gray-400 hover:text-red-400 transition font-medium"
      >
        Sair →
      </button>
    </nav>
  )
}

export default Navbar
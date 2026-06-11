import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

function Navbar() {
  const { logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path
  const podeVerUsuarios = ['admin', 'supervisao'].includes(user?.perfil)

  return (
    <nav className="
      bg-white dark:bg-gray-900
      border-b border-gray-200 dark:border-gray-800
      px-6 py-3.5 flex items-center justify-between
      sticky top-0 z-40 backdrop-blur-sm
      bg-white/90 dark:bg-gray-900/90
    ">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-yellow-400 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-gray-900 dark:text-white font-bold text-base tracking-tight">FiscalHub</span>
          <span className="text-gray-400 dark:text-gray-500 text-xs">by Softcom</span>
        </div>
      </div>

      {/* Links */}
      <div className="flex items-center gap-1">
        {[
          { to: '/', label: 'Dashboard' },
          { to: '/empresas', label: 'Empresas' },
          ...(podeVerUsuarios ? [{ to: '/usuarios', label: 'Usuários' }] : []),
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isActive(to)
                ? 'bg-yellow-400 text-gray-900'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          {theme === 'dark' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

        {/* User info */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-yellow-400/20 dark:bg-yellow-400/10 flex items-center justify-center">
            <span className="text-yellow-600 dark:text-yellow-400 text-xs font-bold">
              {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-gray-600 dark:text-gray-400 text-xs hidden sm:block">
            {user?.nome || user?.email}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition font-medium px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-400/10"
        >
          Sair
        </button>
      </div>
    </nav>
  )
}

export default Navbar
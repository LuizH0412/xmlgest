import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Empresas from './pages/Empresas'
import Documentos from './pages/Documentos'
import EmpresaDetalhe from './pages/EmpresaDetalhe'
import Usuarios from './pages/Usuarios'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/empresas" element={
            <ProtectedRoute>
              <Empresas />
            </ProtectedRoute>
          } />
          <Route path="/documentos" element={
            <ProtectedRoute>
              <Documentos />
            </ProtectedRoute>
          } />
          <Route path="/empresas/:codigo" element={
            <ProtectedRoute>
              <EmpresaDetalhe />
            </ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <ProtectedRoute roles={['admin', 'supervisao']}>
              <Usuarios />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
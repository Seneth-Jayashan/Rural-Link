import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { AppShell } from './shell/AppShell.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import VerifyEmail from './pages/auth/VerifyEmail.jsx'
import CustomerHome from './pages/customer/Home.jsx'
import MerchantDashboard from './pages/merchant/Dashboard.jsx'
import DeliveryDashboard from './pages/deliver/Dashboard.jsx'
import OrderTracking from './pages/common/OrderTracking.jsx'
import { LanguageProvider } from './shared/i18n/LanguageContext.jsx'
import { ToastProvider } from './shared/ui/Toast.jsx'
import { useAuth, AuthProvider } from './shared/auth/AuthContext.jsx'

function RequireAuth({ children }){
  const { user, loading } = useAuth()
  if (loading) return <div className="p-4">Loading...</div>
  return user ? children : <Login />
}

function RequireRole({ role, children }){
  const { user, loading } = useAuth()
  if (loading) return <div className="p-4">Loading...</div>
  if (!user) return <Login />
  return user.role === role ? children : <div className="p-4">Access denied</div>
}

function NotAuthOnly({ children }){
  const { user, loading } = useAuth()
  if (loading) return <div className="p-4">Loading...</div>
  if (!user) return children
  // Redirect logged-in users by role
  if (user.role === 'merchant') return <MerchantDashboard />
  if (user.role === 'deliver') return <DeliveryDashboard />
  return <CustomerHome />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <RequireRole role="customer"><CustomerHome /></RequireRole> },
      { path: 'login', element: <NotAuthOnly><Login /></NotAuthOnly> },
      { path: 'register', element: <NotAuthOnly><Register /></NotAuthOnly> },
      { path: 'verify-email/:token', element: <NotAuthOnly><VerifyEmail /></NotAuthOnly> },
      { path: 'merchant', element: <RequireRole role="merchant"><MerchantDashboard /></RequireRole> },
      { path: 'deliver', element: <RequireRole role="deliver"><DeliveryDashboard /></RequireRole> },
      { path: 'track/:orderId', element: <RequireAuth><OrderTracking /></RequireAuth> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import { AppShell } from './shell/AppShell.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import VerifyEmail from './pages/auth/VerifyEmail.jsx'
import CustomerHome from './pages/customer/Home.jsx'
import MerchantDashboard from './pages/merchant/Dashboard.jsx'
import ProductsList from './pages/merchant/ProductsList.jsx'
import ProductCreate from './pages/merchant/ProductCreate.jsx'
import ProductEdit from './pages/merchant/ProductEdit.jsx'
import ProductView from './pages/merchant/ProductView.jsx'
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
  if (user.role === role) return children
  // Redirect to the correct dashboard instead of showing Access Denied
  if (user.role === 'merchant') return <Navigate to="/merchant" replace />
  if (user.role === 'deliver') return <Navigate to="/deliver" replace />
  return <Navigate to="/" replace />
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

// Home route that sends logged-in users to their role dashboard
function HomeRouter(){
  const { user, loading } = useAuth()
  if (loading) return <div className="p-4">Loading...</div>
  if (!user) return <CustomerHome />
  if (user.role === 'merchant') return <Navigate to="/merchant" replace />
  if (user.role === 'deliver') return <Navigate to="/deliver" replace />
  return <CustomerHome />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      // Send users to appropriate dashboard or public home when they land on '/'
      { index: true, element: <HomeRouter /> },
      { path: 'login', element: <NotAuthOnly><Login /></NotAuthOnly> },
      { path: 'register', element: <NotAuthOnly><Register /></NotAuthOnly> },
      { path: 'verify-email/:token', element: <NotAuthOnly><VerifyEmail /></NotAuthOnly> },
      { path: 'merchant', element: <RequireRole role="merchant"><Navigate to="/merchant/products" replace /></RequireRole> },
      { path: 'merchant/products', element: <RequireRole role="merchant"><ProductsList /></RequireRole> },
      { path: 'merchant/products/new', element: <RequireRole role="merchant"><ProductCreate /></RequireRole> },
      { path: 'merchant/products/:id', element: <RequireRole role="merchant"><ProductView /></RequireRole> },
      { path: 'merchant/products/:id/edit', element: <RequireRole role="merchant"><ProductEdit /></RequireRole> },
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

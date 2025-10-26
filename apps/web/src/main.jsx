import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import { AppShell } from './shell/AppShell.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import VerifyCode from './pages/auth/VerifyCode.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import VerifyEmail from './pages/auth/VerifyEmail.jsx'
import CustomerHome from './pages/customer/Home.jsx'
import MerchantDashboard from './pages/merchant/Dashboard.jsx'
import MerchantOrders from './pages/merchant/Orders.jsx'
import ProductsList from './pages/merchant/ProductsList.jsx'
import ProductCreate from './pages/merchant/ProductCreate.jsx'
import ProductEdit from './pages/merchant/ProductEdit.jsx'
import ProductView from './pages/merchant/ProductView.jsx'
import MerchantReports from './pages/merchant/Reports.jsx'
import DeliveryDashboard from './pages/deliver/Dashboard.jsx'
import OrderTracking from './pages/common/OrderTracking.jsx'
import Cart from './pages/common/Cart.jsx'
import Checkout from './pages/common/Checkout.jsx'
import Account from './pages/common/Account.jsx'
import AccountEdit from './pages/common/AccountEdit.jsx'
import Terms from './pages/common/Terms.jsx'
import Privacy from './pages/common/Privacy.jsx'
import Help from './pages/common/Help.jsx'
import CustomerOrders from './pages/customer/Orders.jsx'
import TrackAll from './pages/common/TrackAll.jsx'
import MapDemo from './pages/common/MapDemo.jsx'
import ProductDetails from './pages/common/ProductDetails.jsx'
import { LanguageProvider } from './shared/i18n/LanguageContext.jsx'
import { ToastProvider } from './shared/ui/Toast.jsx'
import { useAuth, AuthProvider } from './shared/auth/AuthContext.jsx'
import { CartProvider } from './shared/CartContext.jsx'
import Onboarding from './pages/common/Onboarding.jsx'

function RequireAuth({ children }){
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Login />
}

function RequireRole({ role, children }){
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Login />
  if (user.role === role) return children
  // Redirect to the correct dashboard instead of showing Access Denied
  if (user.role === 'merchant') return <Navigate to="/merchant" replace />
  if (user.role === 'deliver') return <Navigate to="/deliver" replace />
  return <Navigate to="/" replace />
}

function NotAuthOnly({ children }){
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return children
  // Redirect logged-in users by role
  if (user.role === 'merchant') return <MerchantDashboard />
  if (user.role === 'deliver') return <DeliveryDashboard />
  return <CustomerHome />
}

// Home route that sends logged-in users to their role dashboard
function HomeRouter(){
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Onboarding />
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
      { path: 'forgot-password', element: <NotAuthOnly><ForgotPassword /></NotAuthOnly> },
      { path: 'reset-password', element: <NotAuthOnly><ResetPassword /></NotAuthOnly> },
      { path: 'verify-code', element: <NotAuthOnly><VerifyCode /></NotAuthOnly> },
      { path: 'verify-email/:token/:hint', element: <NotAuthOnly><VerifyEmail /></NotAuthOnly> },
      { path: 'merchant', element: <RequireRole role="merchant"><Navigate to="/merchant/dashboard" replace /></RequireRole> },
      { path: 'merchant/dashboard', element: <RequireRole role="merchant"><MerchantDashboard /></RequireRole> },
      { path: 'merchant/orders', element: <RequireRole role="merchant"><MerchantOrders /></RequireRole> },
      { path: 'merchant/products', element: <RequireRole role="merchant"><ProductsList /></RequireRole> },
      { path: 'merchant/products/new', element: <RequireRole role="merchant"><ProductCreate /></RequireRole> },
      { path: 'merchant/products/:id', element: <RequireRole role="merchant"><ProductView /></RequireRole> },
      { path: 'merchant/products/:id/edit', element: <RequireRole role="merchant"><ProductEdit /></RequireRole> },
      { path: 'merchant/reports', element: <RequireRole role="merchant"><MerchantReports /></RequireRole> },
      { path: 'deliver', element: <RequireRole role="deliver"><DeliveryDashboard /></RequireRole> },
      { path: 'track/:orderId', element: <RequireAuth><OrderTracking /></RequireAuth> },
      { path: 'track', element: <RequireRole role="customer"><TrackAll /></RequireRole> },
      { path: 'orders', element: <RequireRole role="customer"><CustomerOrders /></RequireRole> },
      { path: 'product/:id', element: <ProductDetails /> },
      // Chat/Call demo route removed
      { path: 'cart', element: <RequireRole role="customer"><Cart /></RequireRole> },
      { path: 'checkout', element: <RequireRole role="customer"><Checkout /></RequireRole> },
      { path: 'account', element: <RequireAuth><Account /></RequireAuth> },
      { path: 'account/edit', element: <RequireAuth><AccountEdit /></RequireAuth> },
      { path: 'map-demo', element: <MapDemo /> },
      { path: 'terms', element: <Terms /> },
      { path: 'privacy', element: <Privacy /> },
      { path: 'help', element: <Help /> },
    ],
  },
])

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("Firebase service worker registered:", registration);
    })
    .catch((err) => console.error("Service worker registration failed:", err));
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  </StrictMode>,
)

import { QueryClientProvider } from '@tanstack/react-query'
import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AccountLayout } from '@/components/layout/AccountLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { HomeLayout } from '@/components/layout/HomeLayout'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { paths } from '@/config/routes'
import { AuthProvider, RequireAuth } from '@/features/auth'
import { CartDrawer } from '@/features/marketplace'
import { HomePage } from '@/features/home/HomePage'
import { queryClient } from '@/lib/query-client'
import { ErrorBoundary } from './ErrorBoundary'
import { NotFoundPage } from './NotFoundPage'
import { RouteEffects } from './RouteEffects'

const PortalOverviewPage = lazy(() => import('@/features/admin/OverviewPage'))
const PortalRequestsPage = lazy(() => import('@/features/admin/RequestsPage'))
const PortalOrdersPage = lazy(() => import('@/features/admin/OrdersPage'))
const PortalCustomersPage = lazy(() => import('@/features/admin/CustomersPage'))
const PortalProvidersPage = lazy(() => import('@/features/admin/ProvidersPage'))
const PortalActivityPage = lazy(() => import('@/features/admin/ActivityPage'))
const LoginPage = lazy(() => import('@/features/account/LoginPage'))
const SignupPage = lazy(() => import('@/features/account/SignupPage'))
const DashboardPage = lazy(() => import('@/features/account/DashboardPage'))
const PolicyPage = lazy(() => import('@/features/account/PolicyPage'))
const RequestsPage = lazy(() => import('@/features/account/RequestsPage'))
const ProfilePage = lazy(() => import('@/features/account/ProfilePage'))
const MemorialPage = lazy(() => import('@/features/memorials/MemorialPage'))
const MemorialsPage = lazy(() => import('@/features/memorials/MemorialsPage'))
const MemorialEditorPage = lazy(() => import('@/features/memorials/MemorialEditorPage'))
const AboutPage = lazy(() => import('@/features/about/AboutPage'))
const MarketplacePage = lazy(() => import('@/features/marketplace/MarketplacePage'))
const ProductPage = lazy(() => import('@/features/marketplace/ProductPage'))
const CheckoutPage = lazy(() => import('@/features/marketplace/CheckoutPage'))
const OrdersPage = lazy(() => import('@/features/marketplace/OrdersPage'))
const OrderPage = lazy(() => import('@/features/marketplace/OrderPage'))

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <RouteEffects />
            <CartDrawer />
            <Routes>
              <Route element={<HomeLayout />}>
                <Route index element={<HomePage />} />
                <Route path={`${paths.memorials}/:slug`} element={<MemorialPage />} />
                <Route path={paths.about} element={<AboutPage />} />
                <Route path={paths.marketplace} element={<MarketplacePage />} />
                <Route path={`${paths.marketplace}/:id`} element={<ProductPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route element={<AuthLayout />}>
                <Route path={paths.login} element={<LoginPage />} />
                <Route path={paths.signup} element={<SignupPage />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route element={<HomeLayout />}>
                  <Route path={paths.checkout} element={<CheckoutPage />} />
                </Route>
                <Route element={<AccountLayout />}>
                  <Route path={paths.account} element={<DashboardPage />} />
                  <Route path={paths.accountPolicy} element={<PolicyPage />} />
                  <Route path={paths.accountRequests} element={<RequestsPage />} />
                  <Route path={paths.accountMemorials} element={<MemorialsPage />} />
                  <Route path={`${paths.accountMemorials}/:id`} element={<MemorialEditorPage />} />
                  <Route path={paths.accountOrders} element={<OrdersPage />} />
                  <Route path={`${paths.accountOrders}/:id`} element={<OrderPage />} />
                  <Route path={paths.accountProfile} element={<ProfilePage />} />
                </Route>
              </Route>

              <Route element={<RequireAuth roles={['provider', 'admin']} />}>
                <Route element={<PortalLayout />}>
                  <Route path={paths.provider} element={<PortalOverviewPage />} />
                  <Route path={paths.portalRequests} element={<PortalRequestsPage />} />
                  <Route path={paths.portalOrders} element={<PortalOrdersPage />} />
                  <Route element={<RequireAuth roles={['admin']} />}>
                    <Route path={paths.portalCustomers} element={<PortalCustomersPage />} />
                    <Route path={paths.portalProviders} element={<PortalProvidersPage />} />
                    <Route path={paths.portalActivity} element={<PortalActivityPage />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

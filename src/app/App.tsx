import { QueryClientProvider } from '@tanstack/react-query'
import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AccountLayout } from '@/components/layout/AccountLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { HomeLayout } from '@/components/layout/HomeLayout'
import { ProviderLayout } from '@/components/layout/ProviderLayout'
import { paths } from '@/config/routes'
import { AuthProvider, RequireAuth } from '@/features/auth'
import { HomePage } from '@/features/home/HomePage'
import { queryClient } from '@/lib/query-client'
import { ErrorBoundary } from './ErrorBoundary'
import { NotFoundPage } from './NotFoundPage'
import { RouteEffects } from './RouteEffects'

const ProviderPortalPage = lazy(() => import('@/features/provider/ProviderPortalPage'))
const LoginPage = lazy(() => import('@/features/account/LoginPage'))
const SignupPage = lazy(() => import('@/features/account/SignupPage'))
const DashboardPage = lazy(() => import('@/features/account/DashboardPage'))
const PolicyPage = lazy(() => import('@/features/account/PolicyPage'))
const RequestsPage = lazy(() => import('@/features/account/RequestsPage'))
const ProfilePage = lazy(() => import('@/features/account/ProfilePage'))

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <RouteEffects />
            <Routes>
              <Route element={<HomeLayout />}>
                <Route index element={<HomePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route element={<AuthLayout />}>
                <Route path={paths.login} element={<LoginPage />} />
                <Route path={paths.signup} element={<SignupPage />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route element={<AccountLayout />}>
                  <Route path={paths.account} element={<DashboardPage />} />
                  <Route path={paths.accountPolicy} element={<PolicyPage />} />
                  <Route path={paths.accountRequests} element={<RequestsPage />} />
                  <Route path={paths.accountProfile} element={<ProfilePage />} />
                </Route>
              </Route>

              <Route element={<RequireAuth roles={['provider', 'staff', 'admin']} />}>
                <Route element={<ProviderLayout />}>
                  <Route path={paths.provider} element={<ProviderPortalPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

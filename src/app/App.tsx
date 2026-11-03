import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomeLayout } from '@/components/layout/HomeLayout'
import { ProviderLayout } from '@/components/layout/ProviderLayout'
import { paths } from '@/config/routes'
import { HomePage } from '@/features/home/HomePage'
import { ErrorBoundary } from './ErrorBoundary'
import { NotFoundPage } from './NotFoundPage'
import { RouteEffects } from './RouteEffects'

const ProviderPortalPage = lazy(() => import('@/features/provider/ProviderPortalPage'))

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <RouteEffects />
        <Routes>
          <Route element={<HomeLayout />}>
            <Route index element={<HomePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route element={<ProviderLayout />}>
            <Route path={paths.provider} element={<ProviderPortalPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

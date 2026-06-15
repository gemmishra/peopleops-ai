import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider.jsx'
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx'
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute.jsx'
import { AppLayout } from './components/layout/AppLayout.jsx'
import { FullPageLoader } from './components/common/FullPageLoader.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { UploadPayrollPage } from './pages/UploadPayrollPage.jsx'
import { PayrollBatchesPage } from './pages/PayrollBatchesPage.jsx'
import { BatchDetailsPage } from './pages/BatchDetailsPage.jsx'
import { AuditLogsPage } from './pages/AuditLogsPage.jsx'

const HomePage = lazy(() => import('./pages/HomePage.jsx'))

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<FullPageLoader />}>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<HomePage />} />
                <Route
                  path="/upload-payroll"
                  element={<UploadPayrollPage />}
                />
                <Route
                  path="/payroll-batches"
                  element={<PayrollBatchesPage />}
                />
                <Route
                  path="/payroll-batches/:batchId"
                  element={<BatchDetailsPage />}
                />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ApiClientProvider } from './context/ApiClientContext'
import { AuthProvider } from './context/AuthContext'
import { ReferenceDataProvider } from './context/ReferenceDataContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { HomeLayout } from './pages/HomeLayout'
import { Dashboard } from './pages/Dashboard'
import { Settings } from './pages/Settings'
import { Profile } from './pages/Profile'

// Accounting pages
import { InvoiceWizard } from './pages/accounting/InvoiceWizard'
import { Invoices } from './pages/accounting/Invoices'
import { InvoiceDetails } from './pages/accounting/InvoiceDetails'
import { RipsCorrection } from './pages/accounting/RipsCorrection'
import { CreditNotes } from './pages/accounting/CreditNotes'
import { CreditNoteDetails } from './pages/accounting/CreditNoteDetails'
import { CreditNoteWizard } from './pages/accounting/CreditNoteWizard'
import { Clients } from './pages/accounting/Clients'

// Reports pages
import { SalesReport } from './pages/reports/SalesReport'
import { ClientAccountStatement } from './pages/reports/ClientAccountStatement'
import { RipsDispatchReport } from './pages/reports/RipsDispatchReport'
import { ResolutionUsageReport } from './pages/reports/ResolutionUsageReport'

// RIPS pages
import { Patients } from './pages/rips/Patients'
import { ServiceCategoryPage } from './pages/services'
import { Specialists } from './pages/rips/Specialists'
import { RipsWizard } from './pages/rips/RipsWizard'

// System pages
import { Company } from './pages/system/Company'
import { Users } from './pages/system/Users'
import { Roles } from './pages/system/Roles'
import { Workspaces } from './pages/system/Workspaces'
import { InvoiceConfiguration } from './pages/system/InvoiceConfiguration'
import { InvoiceResolutions } from './pages/system/InvoiceResolutions'
import { CreditNoteResolutions } from './pages/system/CreditNoteResolutions'
import { SisproConfiguration } from './pages/system/SisproConfiguration'
import Environment from './pages/system/Environment'
import { Toaster } from '@/components/ui/sonner'
import { VersionBadge } from '@/components/version-badge'

function App() {
  return (
    <BrowserRouter>
      <ApiClientProvider>
        <AuthProvider>
          <ReferenceDataProvider>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes Layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <HomeLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Profile */}
              <Route path="profile" element={<Profile />} />
              
              {/* Accounting Routes */}
              <Route path="accounting/invoices" element={<Invoices />} />
              <Route path="accounting/invoices/new" element={<InvoiceWizard />} />
              <Route path="accounting/invoices/:invoiceId" element={<InvoiceDetails />} />
              <Route path="accounting/invoices/:invoiceId/edit-rips" element={<RipsCorrection />} />
              <Route path="accounting/credit-notes" element={<CreditNotes />} />
              <Route path="accounting/credit-notes/:creditNoteId" element={<CreditNoteDetails />} />
              <Route path="accounting/invoices/:invoiceId/credit-note" element={<CreditNoteWizard />} />
              <Route path="accounting/clients" element={<Clients />} />
              
              {/* Reports Routes */}
              <Route path="reports/sales" element={<SalesReport />} />
              <Route path="reports/client-statement" element={<ClientAccountStatement />} />
              <Route path="reports/rips-dispatch" element={<RipsDispatchReport />} />
              <Route path="reports/resolution-usage" element={<ResolutionUsageReport />} />

              {/* RIPS Routes */}
              <Route path="rips/wizard" element={<RipsWizard />} />
              <Route path="rips/patients" element={<Patients />} />
              <Route path="rips/specialists" element={<Specialists />} />

              {/* Services Routes */}
              <Route path="services" element={<Navigate to="/services/consultas" replace />} />
              <Route path="services/:category" element={<ServiceCategoryPage />} />
              
              {/* System Routes */}
              <Route path="system/company" element={<ProtectedRoute requiredRoles={['Admin', 'SuperAdmin']}><Company /></ProtectedRoute>} />
              <Route path="system/users" element={<ProtectedRoute requiredRoles={['Admin', 'SuperAdmin']}><Users /></ProtectedRoute>} />
              <Route path="system/roles" element={<ProtectedRoute requiredRoles={['Admin', 'SuperAdmin']}><Roles /></ProtectedRoute>} />
              <Route path="system/workspaces" element={<ProtectedRoute requiredRoles="SuperAdmin"><Workspaces /></ProtectedRoute>} />
              <Route path="system/invoice-configuration" element={<ProtectedRoute requiredRoles={['Admin', 'SuperAdmin']}><InvoiceConfiguration /></ProtectedRoute>} />
              <Route path="system/invoice-resolutions" element={<ProtectedRoute requiredRoles={['Admin', 'SuperAdmin']}><InvoiceResolutions /></ProtectedRoute>} />
              <Route path="system/credit-note-resolutions" element={<ProtectedRoute requiredRoles={['Admin', 'SuperAdmin']}><CreditNoteResolutions /></ProtectedRoute>} />
              <Route path="system/sispro-configuration" element={<ProtectedRoute requiredRoles={['Admin', 'SuperAdmin']}><SisproConfiguration /></ProtectedRoute>} />
              <Route path="system/environment" element={<ProtectedRoute requiredRoles={['Admin', 'SuperAdmin']}><Environment /></ProtectedRoute>} />
              
              {/* Settings */}
              <Route path="settings" element={<Settings />} />
              
              {/* Default */}
              <Route path="" element={<Navigate to="/dashboard" replace />} />
            </Route>
            </Routes>
            <Toaster />
            <VersionBadge />
          </ReferenceDataProvider>
        </AuthProvider>
      </ApiClientProvider>
    </BrowserRouter>
  )
}

export default App

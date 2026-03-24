import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import Cart from './pages/Cart'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Cookies from './pages/Cookies'
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import Logs from './pages/Logs'
import Integrations from './pages/Integrations'
import Settings from './pages/Settings'
import PortalLayout from './layouts/PortalLayout'
import PortalDashboard from './pages/portal/PortalDashboard'
import PortalLeads from './pages/portal/PortalLeads'
import PortalUpload from './pages/portal/PortalUpload'
import PortalReplies from './pages/portal/PortalReplies'
import MasterLayout from './layouts/MasterLayout'
import MasterDashboard from './pages/master/MasterDashboard'
import MasterCustomers from './pages/master/MasterCustomers'
import MasterLeads from './pages/master/MasterLeads'
import MasterReplies from './pages/master/MasterReplies'
import MasterSettings from './pages/master/MasterSettings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="logs" element={<Logs />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="dashboard" element={<PortalDashboard />} />
          <Route path="leads" element={<PortalLeads />} />
          <Route path="upload" element={<PortalUpload />} />
          <Route path="replies" element={<PortalReplies />} />
        </Route>
        <Route path="/master" element={<MasterLayout />}>
          <Route index element={<Navigate to="/master/dashboard" replace />} />
          <Route path="dashboard" element={<MasterDashboard />} />
          <Route path="customers" element={<MasterCustomers />} />
          <Route path="leads" element={<MasterLeads />} />
          <Route path="replies" element={<MasterReplies />} />
          <Route path="settings" element={<MasterSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

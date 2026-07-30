import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import OutreachLog from './pages/OutreachLog'
import Settings from './pages/Settings'
import Guide from './pages/Guide'
import { ToastContainer } from './hooks/useToast'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="clients"  element={<Clients />} />
          <Route path="outreach" element={<OutreachLog />} />
          <Route path="settings" element={<Settings />} />
          <Route path="guide"    element={<Guide />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>
  )
}

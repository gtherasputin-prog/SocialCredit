import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Groups from './pages/Groups'
import Jail from './pages/Jail'
import Smugglers from './pages/Smugglers'
import Notifications from './pages/Notifications'
import Chat from './pages/Chat'
import Commissariat from './pages/Commissariat'
import Rules from './pages/Rules'
import NotFound from './pages/NotFound'
import Unauthorized from './pages/Unauthorized'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function Guard({ children }) {
  const token = useSelector(s => s.auth.token)
  return token ? children : <Navigate to="/auth" replace />
}

function AdminGuard({ children }) {
  const user = useSelector(s => s.auth.user)
  const token = useSelector(s => s.auth.token)
  if (!token) return <Navigate to="/auth" replace />
  if (!user?.isAdmin) return <Navigate to="/unauthorized" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Home />} />
        <Route path="profile/:username" element={<Profile />} />
        <Route path="groups" element={<Groups />} />
        <Route path="jail" element={<Jail />} />
        <Route path="smugglers" element={<Smugglers />} />
        <Route path="chat" element={<Chat />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="/peoples-tribunal" element={<AdminGuard><Commissariat /></AdminGuard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

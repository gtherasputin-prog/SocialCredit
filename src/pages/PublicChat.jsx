// PublicChat is now merged into Chat.jsx — redirect there
import { Navigate } from 'react-router-dom'
export default function PublicChat() { return <Navigate to="/chat" replace /> }

import{useState}from'react'
import{useNavigate}from'react-router-dom'
import axios from'axios'
const BASE=import.meta.env.VITE_API_URL||'http://localhost:5000/api'
export default function ForgotPassword(){
  const[email,setEmail]=useState('')
  const[msg,setMsg]=useState('')
  const[err,setErr]=useState('')
  const[loading,setLoading]=useState(false)
  const navigate=useNavigate()
  async function submit(){
    if(!email.trim())return
    setLoading(true);setErr('');setMsg('')
    try{
      await axios.post(`${BASE}/auth/forgot-password`,{email})
      setMsg('If that email is registered, a reset link has been dispatched.')
    }catch(e){setErr(e.response?.data?.error||'Error sending reset email.')}
    setLoading(false)
  }
  return(
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-star rotating">☭</div>
          <h1 className="auth-title">RECOVER ACCESS</h1>
          <p className="auth-sub">Submit your email to the Party archives.</p>
        </div>
        <div className="fg">
          <label>Registered Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@party.gov" autoFocus onKeyDown={e=>e.key==='Enter'&&submit()}/>
        </div>
        {msg&&<div className="notif-ok">{msg}</div>}
        {err&&<div className="err">⚠ {err}</div>}
        <button className="primary auth-submit" onClick={submit} disabled={loading||!!msg}>
          {loading?<span className="spin">☭</span>:'→ Send Reset Link'}
        </button>
        <div className="auth-foot">
          <button className="link-btn" onClick={()=>navigate('/auth')}>← Back to Login</button>
        </div>
      </div>
    </div>
  )
}

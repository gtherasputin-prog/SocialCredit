import{useState}from'react'
import{useNavigate,useSearchParams}from'react-router-dom'
import axios from'axios'
const BASE=import.meta.env.VITE_API_URL||'http://localhost:5000/api'
export default function ResetPassword(){
  const[params]=useSearchParams()
  const token=params.get('token')
  const[password,setPassword]=useState('')
  const[showPass,setShowPass]=useState(false)
  const[msg,setMsg]=useState('')
  const[err,setErr]=useState('')
  const[loading,setLoading]=useState(false)
  const navigate=useNavigate()
  async function submit(){
    if(!password.trim()||!token)return
    setLoading(true);setErr('');setMsg('')
    try{
      await axios.post(`${BASE}/auth/reset-password`,{token,password})
      setMsg('Password updated. Redirecting to login...')
      setTimeout(()=>navigate('/auth'),2000)
    }catch(e){setErr(e.response?.data?.error||'Reset failed. Link may be expired.')}
    setLoading(false)
  }
  if(!token)return(
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-header"><div className="auth-star">⛔</div><h1 className="auth-title">INVALID LINK</h1></div>
        <p style={{color:'var(--muted)',textAlign:'center',marginBottom:20}}>No reset token found. Please request a new link.</p>
        <button className="primary" onClick={()=>navigate('/forgot-password')}>→ Request Reset</button>
      </div>
    </div>
  )
  return(
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-star rotating">☭</div>
          <h1 className="auth-title">SET NEW PASSWORD</h1>
          <p className="auth-sub">Enter your new access credential.</p>
        </div>
        <div className="fg">
          <label>New Password</label>
          <div className="pass-wrap">
            <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Anything you wish" autoFocus onKeyDown={e=>e.key==='Enter'&&submit()}/>
            <button type="button" className="ghost pass-eye" onClick={()=>setShowPass(v=>!v)}>{showPass?'🙈':'👁'}</button>
          </div>
        </div>
        {msg&&<div className="notif-ok">{msg}</div>}
        {err&&<div className="err">⚠ {err}</div>}
        <button className="primary auth-submit" onClick={submit} disabled={loading||!!msg}>
          {loading?<span className="spin">☭</span>:'→ Update Password'}
        </button>
        <div className="auth-foot">
          <button className="link-btn" onClick={()=>navigate('/auth')}>← Back to Login</button>
        </div>
      </div>
    </div>
  )
}

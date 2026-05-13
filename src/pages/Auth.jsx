import{useState,useEffect,useRef,useCallback}from'react'
import{useDispatch,useSelector}from'react-redux'
import{useNavigate,Link}from'react-router-dom'
import{login,register,clearError}from'../slices/authSlice'
import axios from'axios'
const BASE=import.meta.env.VITE_API_URL||'http://localhost:5000/api'
function useDebounce(val,ms=400){
  const[dv,setDv]=useState(val)
  useEffect(()=>{const t=setTimeout(()=>setDv(val),ms);return()=>clearTimeout(t)},[val,ms])
  return dv
}
function FieldStatus({ok,checking,msg}){
  if(checking)return<span className="field-status checking">checking…</span>
  if(ok===true)return<span className="field-status ok">✓ available</span>
  if(ok===false)return<span className="field-status err">✗ {msg}</span>
  return null
}
export default function Auth(){
  const[tab,setTab]=useState('login')
  const[form,setForm]=useState({identifier:'',username:'',email:'',password:''})
  const[showPass,setShowPass]=useState(false)
  const[userStatus,setUserStatus]=useState(null)
  const[emailStatus,setEmailStatus]=useState(null)
  const[checkingUser,setCheckingUser]=useState(false)
  const[checkingEmail,setCheckingEmail]=useState(false)
  const[forgotOpen,setForgotOpen]=useState(false)
  const[forgotEmail,setForgotEmail]=useState('')
  const[forgotMsg,setForgotMsg]=useState('')
  const[forgotLoading,setForgotLoading]=useState(false)
  const dispatch=useDispatch()
  const navigate=useNavigate()
  const{loading,error}=useSelector(s=>s.auth)
  const debouncedUser=useDebounce(form.username,500)
  const debouncedEmail=useDebounce(form.email,500)
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  useEffect(()=>{
    if(tab!=='register'||!debouncedUser.trim()){setUserStatus(null);return}
    setCheckingUser(true)
    axios.get(`${BASE}/auth/check?username=${encodeURIComponent(debouncedUser)}`)
      .then(({data})=>setUserStatus(data.usernameTaken?false:true))
      .catch(()=>setUserStatus(null))
      .finally(()=>setCheckingUser(false))
  },[debouncedUser,tab])
  useEffect(()=>{
    if(tab!=='register'||!debouncedEmail.trim()){setEmailStatus(null);return}
    setCheckingEmail(true)
    axios.get(`${BASE}/auth/check?email=${encodeURIComponent(debouncedEmail)}`)
      .then(({data})=>setEmailStatus(data.emailTaken?false:true))
      .catch(()=>setEmailStatus(null))
      .finally(()=>setCheckingEmail(false))
  },[debouncedEmail,tab])
  const switchTab=useCallback(t=>{
    setTab(t);dispatch(clearError())
    setUserStatus(null);setEmailStatus(null)
    setForm({identifier:'',username:'',email:'',password:''})
  },[dispatch])
  async function submit(){
    let res
    if(tab==='login'){
      res=await dispatch(login({identifier:form.identifier,password:form.password}))
    }else{
      const payload={username:form.username,password:form.password}
      if(form.email.trim())payload.email=form.email.trim()
      res=await dispatch(register(payload))
    }
    if(!res.error)navigate('/')
  }
  async function sendForgot(){
    if(!forgotEmail.trim())return
    setForgotLoading(true)
    try{
      await axios.post(`${BASE}/auth/forgot-password`,{email:forgotEmail})
      setForgotMsg('If that email is registered, a reset link was sent.')
    }catch{setForgotMsg('Error sending reset email.')}
    setForgotLoading(false)
  }
  return(
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-star rotating">☭</div>
          <h1 className="auth-title">SOCIAL CREDIT</h1>
          <p className="auth-sub">The Party evaluates all citizens.</p>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab${tab==='login'?' active':''}`} onClick={()=>switchTab('login')}>Login</button>
          <button className={`auth-tab${tab==='register'?' active':''}`} onClick={()=>switchTab('register')}>Register</button>
        </div>
        <div key={tab} className="auth-form-area">
          {tab==='login'?(
            <>
              <div className="fg">
                <label>Username or Email</label>
                <input value={form.identifier} onChange={set('identifier')} placeholder="citizen_007 or you@party.gov" autoFocus autoComplete="username"/>
              </div>
              <div className="fg">
                <label>Password</label>
                <div className="pass-wrap">
                  <input type={showPass?'text':'password'} value={form.password} onChange={set('password')} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&submit()} autoComplete="current-password"/>
                  <button type="button" className="ghost pass-eye" onClick={()=>setShowPass(v=>!v)}>{showPass?'🙈':'👁'}</button>
                </div>
              </div>
              <button className="link-btn forgot-link" onClick={()=>setForgotOpen(v=>!v)}>Forgot password?</button>
              {forgotOpen&&(
                <div className="forgot-box">
                  <div className="fg">
                    <label>Your email</label>
                    <input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="you@party.gov"/>
                  </div>
                  {forgotMsg&&<div className="notif-ok">{forgotMsg}</div>}
                  <button className="primary sm" onClick={sendForgot} disabled={forgotLoading}>{forgotLoading?'Sending…':'Send Reset Link'}</button>
                </div>
              )}
            </>
          ):(
            <>
              <div className="fg">
                <label>Username <span className="req">*</span></label>
                <input value={form.username} onChange={set('username')} placeholder="citizen_007" maxLength={30} autoFocus autoComplete="username"/>
                <FieldStatus ok={userStatus} checking={checkingUser} msg="Username taken"/>
              </div>
              <div className="fg">
                <label>Email <span className="opt">(optional)</span></label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="you@party.gov" autoComplete="email"/>
                {form.email&&<FieldStatus ok={emailStatus} checking={checkingEmail} msg="Email already registered"/>}
              </div>
              <div className="fg">
                <label>Password <span className="req">*</span></label>
                <div className="pass-wrap">
                  <input type={showPass?'text':'password'} value={form.password} onChange={set('password')} placeholder="Anything you wish" onKeyDown={e=>e.key==='Enter'&&submit()} autoComplete="new-password"/>
                  <button type="button" className="ghost pass-eye" onClick={()=>setShowPass(v=>!v)}>{showPass?'🙈':'👁'}</button>
                </div>
              </div>
              <div className="rules-note">
                By registering you agree to the{' '}
                <Link to="/rules" target="_blank" className="link-btn">Party Rules ☭</Link>
              </div>
            </>
          )}
        </div>
        {error&&<div className="err">⚠ {error}</div>}
        <button className="primary auth-submit" onClick={submit} disabled={loading}>
          {loading?<span className="spin">☭</span>:tab==='login'?'→ Enter the System':'→ Join the Party'}
        </button>
        <div className="auth-foot">
          {tab==='login'
            ?<span>New citizen? <button className="link-btn" onClick={()=>switchTab('register')}>Register</button></span>
            :<span>Already enrolled? <button className="link-btn" onClick={()=>switchTab('login')}>Login</button></span>
          }
        </div>
      </div>
    </div>
  )
}
import{NavLink,Outlet,useNavigate,useLocation}from'react-router-dom'
import{useDispatch,useSelector}from'react-redux'
import{useEffect,useRef,useState}from'react'
import{logout}from'../slices/authSlice'
import{toggle}from'../slices/themeSlice'
import{initWS,onWS}from'../ws'
import api from'../api'
const NOTIF_POLL=60000
export default function Layout(){
  const dispatch=useDispatch()
  const navigate=useNavigate()
  const location=useLocation()
  const user=useSelector(s=>s.auth.user)
  const token=useSelector(s=>s.auth.token)
  const mode=useSelector(s=>s.theme.mode)
  const sc=user?.creditScore
  const scoreClass=sc>=150?'s-great':sc>=80?'s-ok':sc>=30?'s-warn':'s-bad'
  const[notifCount,setNotifCount]=useState(0)
  const[dmCount,setDmCount]=useState(0)
  useEffect(()=>{if(token)initWS(token)},[token])
  useEffect(()=>{
    const off=onWS('dm',()=>{
      if(location.pathname!=='/chat'&&location.pathname!=='/messages')setDmCount(n=>n+1)
    })
    return off
  },[location.pathname])
  useEffect(()=>{
    if(location.pathname==='/chat'||location.pathname==='/messages'){setDmCount(0)}
  },[location.pathname])
  useEffect(()=>{
    const off=onWS('notif_count',({count})=>setNotifCount(count))
    return off
  },[])
  useEffect(()=>{
    const ac=new AbortController()
    const tick=async()=>{
      try{const{data}=await api.get('/notifications/count',{signal:ac.signal});setNotifCount(data.count)}
      catch(e){if(e.code!=='ERR_CANCELED'){}}
    }
    tick()
    const id=setInterval(tick,NOTIF_POLL)
    return()=>{clearInterval(id);ac.abort()}
  },[])
  const links=[
    {to:'/',label:'Feed',icon:'📋',end:true},
    {to:'/groups',label:'Collectives',icon:'🏴'},
    {to:'/smugglers',label:'Smugglers',icon:'🕳️'},
    {to:'/chat',label:'Chat',icon:'💬',badge:dmCount||null,badgeDm:true},
    {to:'/jail',label:'Jail',icon:'🔒'},
    {to:'/notifications',label:'Alerts',icon:'🔔',badge:notifCount||null},
  ]
  return(
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-logo"><h1>☭ SOCIAL CREDIT</h1><small>The Party watches</small></div>
        <div className="nav-links">
          {links.map(({to,label,icon,end,badge,badgeDm})=>(
            <NavLink key={to} to={to} end={end} className={({isActive})=>`nav-link${isActive?' active':''}`}>
              <span>{icon}</span> {label}
              {badge!=null&&<span className={`nav-badge${badgeDm?' dm':''}`}>{badge}</span>}
            </NavLink>
          ))}
        </div>
        <div className="sidebar-foot">
          <div className="me-card" onClick={()=>navigate(`/profile/${user?.username}`)}>
            <div className="av">{user?.avatar?<img src={user.avatar} alt="" loading="lazy"/>:'👤'}</div>
            <div><div className="me-name">{user?.username}</div><div className={`me-score ${scoreClass}`}>★ {sc}</div></div>
          </div>
          <div className="row">
            <button className="ghost" style={{fontSize:13,color:'var(--muted)'}} onClick={()=>dispatch(toggle())}>{mode==='dark'?'☀ Light':'☾ Dark'}</button>
            <button className="ghost" style={{marginLeft:'auto'}} onClick={()=>dispatch(logout())}>Logout</button>
          </div>
        </div>
      </nav>
      <main className="main"><Outlet/></main>
    </div>
  )
}

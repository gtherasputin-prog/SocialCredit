import{useEffect,useState,useCallback,useRef}from'react'
import{useSelector}from'react-redux'
import{useNavigate}from'react-router-dom'
import api from'../api'
import{onWS,sendWS}from'../ws'
// ── helpers ──
const fmt=d=>new Date(d).toLocaleString()
const scoreClass=sc=>sc>=150?'s-great':sc>=80?'s-ok':sc>=30?'s-warn':'s-bad'
// ── DM Modal ──
function AdminDM({user,myId,myUsername,onClose}){
  const[msgs,setMsgs]=useState([])
  const[input,setInput]=useState('')
  const bottomRef=useRef(null)
  useEffect(()=>{const off=onWS('dm',m=>{if(m.from!==user._id)return;setMsgs(p=>[...p,m])});return off},[user._id])
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[msgs.length])
  function send(){const t=input.trim();if(!t)return;sendWS({type:'dm',to:user._id,content:t});setMsgs(p=>[...p,{from:myId,content:t,ts:Date.now()}]);setInput('')}
  return(
    <div className="dm-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="dm-box commissar-dm">
        <div className="dm-head">
          <span className="dm-title" style={{color:'var(--gold)'}}>☭ Interrogating: {user.username}</span>
          <button className="ghost" onClick={onClose}>✕</button>
        </div>
        <div className="dm-messages">
          {msgs.map((m,i)=>(
            <div key={i} className={`dc-msg${m.from===myId?' dm-mine':''}`}>
              <div className="dc-content"><div className="dc-meta"><span className="dc-username" style={{color:m.from===myId?'var(--gold)':'var(--text)'}}>{m.from===myId?myUsername:user.username}</span></div><div className="dc-text">{m.content}</div></div>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>
        <div className="chat-compose">
          <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Send Party directive..." onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())} rows={1} autoFocus/>
          <button className="send-btn" onClick={send}>↑</button>
        </div>
      </div>
    </div>
  )
}
// ── User Row ──
function UserRow({u,onJail,onUnjail,onWarn,onCredit,onDm,refresh}){
  const[jailH,setJailH]=useState(24)
  const[jailR,setJailR]=useState('')
  const[warnMsg,setWarnMsg]=useState('')
  const[creditAmt,setCreditAmt]=useState(0)
  const[open,setOpen]=useState(false)
  const[loading,setLoading]=useState(false)
  const sc=u.creditScore
  async function doJail(){setLoading(true);await onJail(u._id,jailH,jailR||'Party directive');setLoading(false);refresh()}
  async function doUnjail(){setLoading(true);await onUnjail(u._id);setLoading(false);refresh()}
  async function doWarn(){if(!warnMsg.trim())return;setLoading(true);await onWarn(u._id,warnMsg);setLoading(false);setWarnMsg('')}
  async function doCredit(){setLoading(true);await onCredit(u._id,creditAmt);setLoading(false);refresh()}
  const jailed=u.jailed||(u.jailUntil&&new Date(u.jailUntil)>new Date())
  return(
    <div className={`comm-user-row${jailed?' comm-jailed':''}`}>
      <div className="comm-user-info" onClick={()=>setOpen(v=>!v)}>
        <div className="av" style={{width:32,height:32,fontSize:13}}>{u.avatar?<img src={u.avatar} alt="" loading="lazy"/>:u.username[0].toUpperCase()}</div>
        <div>
          <span className="comm-uname">{u.username}{u.isAdmin&&<span className="admin-pip" style={{marginLeft:6}}>COMMISSAR</span>}</span>
          <span className={`score-badge ${scoreClass(sc)}`}>★ {sc}</span>
          {jailed&&<span className="jailed-chip" style={{marginLeft:6}}>JAILED{u.jailUntil?` until ${fmt(u.jailUntil)}`:''}</span>}
        </div>
        <span style={{marginLeft:'auto',color:'var(--muted)',fontSize:12}}>{open?'▲':'▼'}</span>
      </div>
      {open&&(
        <div className="comm-user-actions">
          {/* ── Jail ── */}
          <div className="comm-action-group">
            <label className="comm-action-label">⛓ Jail Sentence</label>
            <div className="comm-action-row">
              <input type="number" min={1} max={720} value={jailH} onChange={e=>setJailH(Number(e.target.value))} className="comm-num-input" placeholder="Hours"/>
              <input value={jailR} onChange={e=>setJailR(e.target.value)} className="comm-text-input" placeholder="Reason..."/>
              <button className="danger" onClick={doJail} disabled={loading}>Jail</button>
              {jailed&&<button className="ghost" style={{color:'var(--green)',border:'1px solid var(--green)'}} onClick={doUnjail} disabled={loading}>Unjail</button>}
            </div>
          </div>
          {/* ── Warning ── */}
          <div className="comm-action-group">
            <label className="comm-action-label">⚠ Send Warning</label>
            <div className="comm-action-row">
              <input value={warnMsg} onChange={e=>setWarnMsg(e.target.value)} className="comm-text-input" placeholder="Warning message..." onKeyDown={e=>e.key==='Enter'&&doWarn()}/>
              <button className="danger" onClick={doWarn} disabled={loading||!warnMsg.trim()}>Warn</button>
            </div>
          </div>
          {/* ── Credit ── */}
          <div className="comm-action-group">
            <label className="comm-action-label">★ Adjust Credit</label>
            <div className="comm-action-row">
              <input type="number" value={creditAmt} onChange={e=>setCreditAmt(Number(e.target.value))} className="comm-num-input" placeholder="±amount"/>
              <button className="ghost" style={{border:'1px solid var(--gold)',color:'var(--gold)'}} onClick={doCredit} disabled={loading}>Apply</button>
            </div>
          </div>
          {/* ── DM ── */}
          <div className="comm-action-group">
            <button className="ghost" style={{border:'1px solid var(--cyan)',color:'var(--cyan)',width:'100%'}} onClick={()=>onDm(u)}>💬 Open Interrogation Channel</button>
          </div>
        </div>
      )}
    </div>
  )
}
// ── Report Card ──
function ReportCard({item,type,onDelete,onClear,onJail,onWarn}){
  const[open,setOpen]=useState(false)
  const[jailH,setJailH]=useState(24)
  const[warnTxt,setWarnTxt]=useState('')
  const author=item.author||item.creator||{}
  return(
    <div className="comm-report-card">
      <div className="comm-report-head" onClick={()=>setOpen(v=>!v)}>
        <span className="comm-report-badge">{item.reports?.length||0} reports</span>
        <span className="comm-report-author">by <strong>{author.username||'unknown'}</strong></span>
        {type==='post'&&<span className="comm-report-preview">"{(item.content||'').slice(0,60)}{item.content?.length>60?'...':''}"</span>}
        {type==='group'&&<span className="comm-report-preview">🏴 {item.name}</span>}
        <span style={{marginLeft:'auto',fontSize:12,color:'var(--muted)'}}>{open?'▲':'▼'}</span>
      </div>
      {open&&(
        <div className="comm-report-body">
          <div className="comm-report-reporters">
            Reported by: {item.reports?.map(r=>(r.user?.username||r.user)).join(', ')||'unknown'}
          </div>
          {type==='post'&&item.content&&<div className="comm-report-content">{item.content}</div>}
          {item.image&&<img src={item.image} alt="" style={{maxWidth:200,borderRadius:4,marginTop:8}}/>}
          <div className="comm-action-row" style={{marginTop:10,flexWrap:'wrap',gap:8}}>
            {type==='post'&&<button className="danger" onClick={()=>onDelete(item._id)}>🗑 Delete Post</button>}
            <button className="ghost" style={{border:'1px solid var(--muted)'}} onClick={()=>onClear(item._id)}>✓ Clear Reports</button>
            {author._id&&(
              <>
                <div style={{display:'flex',gap:6}}>
                  <input type="number" min={1} value={jailH} onChange={e=>setJailH(Number(e.target.value))} className="comm-num-input" style={{width:70}} placeholder="hrs"/>
                  <button className="danger" onClick={()=>onJail(author._id,jailH,'Reported content')}>⛓ Jail Author</button>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <input value={warnTxt} onChange={e=>setWarnTxt(e.target.value)} className="comm-text-input" placeholder="Warning text..." style={{flex:1}}/>
                  <button className="ghost" style={{border:'1px solid var(--gold)',color:'var(--gold)'}} onClick={()=>warnTxt.trim()&&onWarn(author._id,warnTxt)}>⚠ Warn</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
// ── Main Commissariat ──
export default function Commissariat(){
  const me=useSelector(s=>s.auth.user)
  const navigate=useNavigate()
  const[tab,setTab]=useState('overview')
  const[stats,setStats]=useState(null)
  const[users,setUsers]=useState([])
  const[postReports,setPostReports]=useState([])
  const[groupReports,setGroupReports]=useState([])
  const[broadcast,setBroadcast]=useState('')
  const[dmUser,setDmUser]=useState(null)
  const[loading,setLoading]=useState(false)
  const[toast,setToast]=useState(null)
  const[liveCount,setLiveCount]=useState(0)
  const toastId=useRef(0)
  const showToast=useCallback((msg,kind='ok')=>{const id=++toastId.current;setToast({id,msg,kind});setTimeout(()=>setToast(null),4000)},[])
  // ── load data by tab ──
  useEffect(()=>{
    if(tab==='overview')api.get('/commissariat/stats').then(({data})=>setStats(data)).catch(()=>{})
    if(tab==='citizens')api.get('/commissariat/users').then(({data})=>setUsers(data)).catch(()=>{})
    if(tab==='reports'){
      api.get('/commissariat/reports/posts').then(({data})=>setPostReports(data)).catch(()=>{})
      api.get('/commissariat/reports/groups').then(({data})=>setGroupReports(data)).catch(()=>{})
    }
  },[tab])
  // ── WS: online count ──
  useEffect(()=>{
    const off=onWS('ready',({online})=>setLiveCount(online?.length||0))
    const on1=onWS('user_online',()=>setLiveCount(c=>c+1))
    const on2=onWS('user_offline',()=>setLiveCount(c=>Math.max(0,c-1)))
    return()=>{off();on1();on2()}
  },[])
  // ── actions ──
  const jailUser=useCallback(async(id,hours,reason)=>{try{await api.post(`/commissariat/jail/${id}`,{hours,reason});showToast(`Citizen jailed for ${hours}h`)}catch(e){showToast(e.response?.data?.error||'Error','err')}},[showToast])
  const unjailUser=useCallback(async id=>{try{await api.post(`/commissariat/unjail/${id}`);showToast('Citizen released')}catch(e){showToast(e.response?.data?.error||'Error','err')}},[showToast])
  const warnUser=useCallback(async(id,message)=>{try{await api.post(`/commissariat/warn/${id}`,{message});showToast('Warning dispatched ☭')}catch(e){showToast(e.response?.data?.error||'Error','err')}},[showToast])
  const adjustCredit=useCallback(async(id,amount)=>{try{const{data}=await api.post(`/commissariat/credit/${id}`,{amount});showToast(`★ ${data.username}: ${data.creditScore} credits`)}catch(e){showToast(e.response?.data?.error||'Error','err')}},[showToast])
  const deletePost=useCallback(async id=>{try{await api.delete(`/commissariat/post/${id}`);setPostReports(p=>p.filter(x=>x._id!==id));showToast('Post purged')}catch{showToast('Error','err')}},[showToast])
  const clearReports=useCallback(async id=>{try{await api.post(`/commissariat/clear-reports/${id}`);setPostReports(p=>p.filter(x=>x._id!==id));showToast('Reports cleared')}catch{showToast('Error','err')}},[showToast])
  const sendBroadcast=useCallback(async()=>{if(!broadcast.trim())return;setLoading(true);try{await api.post('/commissariat/broadcast',{message:broadcast});setBroadcast('');showToast('Broadcast transmitted to all citizens ☭')}catch{showToast('Error','err')}setLoading(false)},[broadcast,showToast])
  const refreshUsers=useCallback(()=>api.get('/commissariat/users').then(({data})=>setUsers(data)).catch(()=>{}),[])
  const TABS=[{id:'overview',label:'☭ Overview'},{id:'citizens',label:'👁 Citizens'},{id:'reports',label:'⚠ Reports'},{id:'broadcast',label:'📢 Broadcast'}]
  return(
    <div className="commissariat-page">
      <div className="comm-header">
        <button className="ghost" onClick={()=>navigate('/')} style={{marginRight:12}}>← Exit</button>
        <div className="comm-logo">
          <span className="comm-star">☭</span>
          <div>
            <h1>PEOPLE'S TRIBUNAL</h1>
            <p>Central Committee Control Interface</p>
          </div>
        </div>
        <div className="comm-live-badge"><span className="online-dot"/>live: {liveCount}</div>
      </div>
      <div className="comm-tabs">
        {TABS.map(t=><button key={t.id} className={`comm-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}
      </div>
      <div className="comm-body">
        {/* ── Overview ── */}
        {tab==='overview'&&(
          <div className="comm-overview">
            <div className="comm-admin-card">
              <div className="comm-admin-star">☭</div>
              <div className="comm-admin-info">
                <span className="comm-admin-name">{me?.username}</span>
                <span className="comm-admin-rank">COMMISSAR — SUPREME AUTHORITY</span>
                <span className="comm-admin-score" style={{color:'var(--gold)'}}>★ ∞ SOCIAL CREDIT (INFINITE)</span>
              </div>
            </div>
            {stats&&(
              <div className="comm-stats">
                {[['Total Citizens',stats.users,'👥'],['Total Posts',stats.posts,'📋'],['In Gulag',stats.jailed,'⛓'],['Reported',stats.reported,'⚠']].map(([label,val,icon])=>(
                  <div key={label} className="comm-stat">
                    <div className="comm-stat-icon">{icon}</div>
                    <div className="comm-stat-val">{val}</div>
                    <div className="comm-stat-label">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ── Citizens ── */}
        {tab==='citizens'&&(
          <div>
            <div className="ph" style={{marginBottom:16}}><div><h2>Citizen Registry</h2><p>{users.length} total citizens on record</p></div></div>
            {users.map(u=><UserRow key={u._id} u={u} onJail={jailUser} onUnjail={unjailUser} onWarn={warnUser} onCredit={adjustCredit} onDm={setDmUser} refresh={refreshUsers}/>)}
          </div>
        )}
        {/* ── Reports ── */}
        {tab==='reports'&&(
          <div>
            <div className="ph" style={{marginBottom:16}}><div><h2>Incident Reports</h2><p>Posts and groups flagged by citizens</p></div></div>
            {postReports.length===0&&groupReports.length===0&&<div className="empty">No reports filed. The Party is pleased.</div>}
            {postReports.length>0&&(
              <>
                <h3 style={{color:'var(--muted)',fontSize:13,letterSpacing:2,marginBottom:10}}>POST REPORTS ({postReports.length})</h3>
                {postReports.map(r=><ReportCard key={r._id} item={r} type="post" onDelete={deletePost} onClear={clearReports} onJail={(id,h,reason)=>jailUser(id,h,reason)} onWarn={warnUser}/>)}
              </>
            )}
            {groupReports.length>0&&(
              <>
                <h3 style={{color:'var(--muted)',fontSize:13,letterSpacing:2,margin:'20px 0 10px'}}>COLLECTIVE REPORTS ({groupReports.length})</h3>
                {groupReports.map(r=><ReportCard key={r._id} item={r} type="group" onDelete={()=>{}} onClear={clearReports} onJail={(id,h,reason)=>jailUser(id,h,reason)} onWarn={warnUser}/>)}
              </>
            )}
          </div>
        )}
        {/* ── Broadcast ── */}
        {tab==='broadcast'&&(
          <div>
            <div className="ph" style={{marginBottom:16}}><div><h2>Public Broadcast</h2><p>Send a message to all citizens in real-time</p></div></div>
            <div className="comm-broadcast-wrap">
              <div className="comm-broadcast-icon">📢</div>
              <p className="comm-broadcast-desc">This message will appear as a warning banner to every connected citizen. Use wisely — the Party's word carries weight.</p>
              <textarea value={broadcast} onChange={e=>setBroadcast(e.target.value)} className="comm-broadcast-input" placeholder="Type your Party directive here..." rows={4}/>
              <button className="primary" onClick={sendBroadcast} disabled={loading||!broadcast.trim()} style={{marginTop:12}}>
                {loading?<span className="spin">☭</span>:'☭ Broadcast to All Citizens'}
              </button>
            </div>
          </div>
        )}
      </div>
      {/* ── DM Modal ── */}
      {dmUser&&<AdminDM user={dmUser} myId={me?._id} myUsername={me?.username} onClose={()=>setDmUser(null)}/>}
      {/* ── Toast ── */}
      {toast&&(
        <div className={`toast-item toast-${toast.kind}`} style={{position:'fixed',bottom:24,right:24,zIndex:9999,minWidth:240}}>
          {toast.msg}<button className="ghost" onClick={()=>setToast(null)} style={{marginLeft:10}}>✕</button>
        </div>
      )}
    </div>
  )
}

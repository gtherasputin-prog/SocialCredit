import{useEffect,useRef,useState,useCallback}from'react'
import{useSelector}from'react-redux'
import{useNavigate,useLocation}from'react-router-dom'
import{sendWS,onWS}from'../ws'
import api from'../api'
const PALETTE=['#4fc3f7','#69f0ae','#ff6b6b','#ffd166','#c77dff','#06d6a0','#f9844a','#f72585','#a0c4ff','#caffbf']
function uc(s){let h=0;for(let i=0;i<s.length;i++)h=s.charCodeAt(i)+((h<<5)-h);return PALETTE[Math.abs(h)%PALETTE.length]}
function timeStr(d){if(!d)return'';return new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
function isGrouped(cur,prev){
  if(!prev)return false
  const cid=cur.author?._id||cur.author,pid=prev.author?._id||prev.author
  if(cid!==pid)return false
  return new Date(cur.createdAt)-new Date(prev.createdAt)<300000
}
function isDmGrouped(cur,prev){
  if(!prev)return false
  const cid=cur.from?._id||cur.from,pid=prev.from?._id||prev.from
  if(cid!==pid)return false
  return(cur.ts||0)-(prev.ts||0)<300000
}
function TypingBar({typists,myId}){
  const names=typists.filter(t=>t.userId!==myId).map(t=>t.username)
  if(!names.length)return<div className="typing-bar"/>
  return(
    <div className="typing-bar">
      <div className="typing-dots"><span/><span/><span/></div>
      <span style={{color:'var(--muted)',fontSize:12}}>{names.join(', ')} {names.length===1?'is':'are'} typing...</span>
    </div>
  )
}
function Lightbox({src,onClose}){
  useEffect(()=>{const h=e=>e.key==='Escape'&&onClose();window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[onClose])
  return<div className="lb-overlay" onClick={onClose}><img src={src} alt="" onClick={e=>e.stopPropagation()} loading="lazy"/></div>
}
function EyeTyping({active}){
  const pupilY=active?13:9
  return(
    <svg width="32" height="20" viewBox="0 0 32 20">
      <ellipse cx="16" cy="10" rx="15" ry="9" fill="white" stroke="var(--border)" strokeWidth="1"/>
      <circle cx="16" cy={pupilY} r="5" fill="#1a1a1a" style={{transition:'cy .3s ease'}}/>
      <circle cx="16" cy={pupilY} r="2.8" fill="var(--accent)" style={{transition:'cy .3s ease'}}/>
      <circle cx="17.5" cy={pupilY-1.5} r="1.1" fill="rgba(255,255,255,.65)" style={{transition:'cy .3s ease'}}/>
    </svg>
  )
}
function DmModal({user,myId,myUsername,myAvatar,onClose,onReport}){
  const[messages,setMessages]=useState([])
  const[input,setInput]=useState('')
  const[lb,setLb]=useState(null)
  const[typing,setTyping]=useState(false)
  const bottomRef=useRef(null)
  const typingTimer=useRef(null)
  const inputFocused=useRef(false)
  const col=uc(user.username)
  useEffect(()=>{
    api.get(`/messages/${user._id}`).then(({data})=>setMessages(data)).catch(()=>{})
  },[user._id])
  useEffect(()=>{
    const offDm=onWS('dm',msg=>{
      if(msg.from!==user._id)return
      const m={_id:msg.dbId||msg.id,from:{_id:msg.from,username:user.username,avatar:user.avatar},content:msg.content,attachments:msg.attachments,createdAt:new Date(msg.ts||Date.now()).toISOString(),ts:msg.ts}
      setMessages(prev=>{if(prev.some(x=>x._id===m._id))return prev;return[...prev,m]})
      sendWS({type:'read_dm',from:msg.from})
    })
    const offSent=onWS('dm_sent',msg=>{
      setMessages(p=>p.map(m=>m._id===msg.id?{...m,_id:msg.dbId||m._id,pending:false}:m))
    })
    const offTyping=onWS('typing_dm',msg=>{if(msg.from===user._id)setTyping(true)})
    const offStop=onWS('stop_typing_dm',msg=>{if(msg.from===user._id)setTyping(false)})
    return()=>{offDm();offSent();offTyping();offStop()}
  },[user._id])
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'instant'})},[messages.length])
  function handleInput(val){
    setInput(val)
    sendWS({type:'typing_dm',to:user._id})
    clearTimeout(typingTimer.current)
    typingTimer.current=setTimeout(()=>{},1500)
  }
  function send(){
    const text=input.trim();if(!text)return
    const tempId=`l-${Date.now()}`
    const m={_id:tempId,from:{_id:myId},content:text,ts:Date.now(),pending:true,createdAt:new Date().toISOString()}
    setMessages(p=>[...p,m]);setInput('')
    sendWS({type:'dm',id:tempId,to:user._id,content:text})
  }
  return(
    <>
      <div className="dm-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
        <div className="dm-box">
          <div className="dm-head">
            <span className="dm-title" style={{color:col,display:'flex',alignItems:'center',gap:8}}>
              {user.avatar&&<img src={user.avatar} alt="" style={{width:22,height:22,objectFit:'cover',borderRadius:'50%'}}/>}
              {user.username}
            </span>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <button className="ghost" style={{fontSize:12,color:'var(--red)'}} onClick={()=>onReport(user._id)}>☭ Report</button>
              <button className="ghost" onClick={onClose}>✕</button>
            </div>
          </div>
          <div className="dm-messages">
            {messages.length===0&&<div className="empty">No messages yet.</div>}
            {messages.map((m,i)=>{
              const mine=(m.from?._id||m.from)===myId
              const who=mine?myUsername:user.username
              const c=mine?'var(--accent)':col
              const av=mine?myAvatar:user.avatar
              const grouped=isDmGrouped(m,messages[i-1])
              if(grouped)return(
                <div key={m._id} className={`dc-msg dm-dc-msg dc-cont${m.pending?' pending':''}`}>
                  <div className="dc-text" style={{fontSize:15}}>{m.content}</div>
                </div>
              )
              return(
                <div key={m._id} className={`dc-msg dm-dc-msg${m.pending?' pending':''}`}>
                  <div className="dc-avatar" style={{background:av?'transparent':c,color:'#111',width:28,height:28,fontSize:12,flexShrink:0}}>
                    {av?<img src={av} alt="" loading="lazy"/>:who[0]?.toUpperCase()}
                  </div>
                  <div className="dc-content">
                    <div className="dc-meta">
                      <span className="dc-username" style={{color:c}}>{who}</span>
                      <span className="dc-time">{timeStr(m.createdAt||new Date(m.ts||0))}</span>
                      {m.pending&&<span className="dc-sending">sending…</span>}
                      {!mine&&<button className="eye-report-btn" title="Report message" onClick={()=>onReport(user._id)}>☭</button>}
                    </div>
                    <div className="dc-text" style={{fontSize:15}}>{m.content}</div>
                  </div>
                </div>
              )
            })}
            {typing&&(
              <div style={{padding:'4px 14px',display:'flex',alignItems:'center',gap:8}}>
                <EyeTyping active={inputFocused.current}/>
                <span style={{fontSize:12,color:'var(--muted)'}}>{user.username} is typing…</span>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
          <div className="chat-compose">
            <textarea value={input}
              onChange={e=>handleInput(e.target.value)}
              placeholder={`Message ${user.username}…`}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())}
              onFocus={()=>{inputFocused.current=true}}
              onBlur={()=>{inputFocused.current=false}}
              rows={1} autoFocus/>
            <button className="send-btn" onClick={send}>↑</button>
          </div>
        </div>
      </div>
      {lb&&<Lightbox src={lb} onClose={()=>setLb(null)}/>}
    </>
  )
}
export default function Chat(){
  const[messages,setMessages]=useState([])
  const[onlineUsers,setOnlineUsers]=useState([])
  const[input,setInput]=useState('')
  const[files,setFiles]=useState([])
  const[dmUser,setDmUser]=useState(null)
  const[dmUnread,setDmUnread]=useState({})
  const[lb,setLb]=useState(null)
  const[toast,setToast]=useState(null)
  const[typists,setTypists]=useState([])
  const fileRef=useRef(null)
  const bottomRef=useRef(null)
  const typingRef=useRef(null)
  const user=useSelector(s=>s.auth.user)
  const myId=user?._id
  const myUsername=user?.username||'Citizen'
  const myAvatar=user?.avatar
  const navigate=useNavigate()
  useEffect(()=>{
    const ac=new AbortController()
    api.get('/ws/online',{signal:ac.signal}).then(({data})=>setOnlineUsers(data||[])).catch(()=>{})
    return()=>ac.abort()
  },[])
  useEffect(()=>{
    const ac=new AbortController()
    api.get('/chat',{signal:ac.signal}).then(({data})=>setMessages(data)).catch(()=>{})
    return()=>ac.abort()
  },[])
  useEffect(()=>{
    const offChat=onWS('chat',({msg})=>{
      setMessages(prev=>{
        const dup=prev.some(m=>m._id===msg._id)
        if(dup)return prev
        return[...prev.filter(m=>!(m._id?.startsWith('l-')&&m.content===msg.content)),msg]
      })
    })
    const offReady=onWS('ready',({online})=>setOnlineUsers(online||[]))
    const offOn=onWS('user_online',({user:u})=>setOnlineUsers(prev=>{const next=prev.filter(x=>x._id!==u._id);return[...next,u]}))
    const offOff=onWS('user_offline',({userId})=>setOnlineUsers(prev=>prev.filter(x=>x._id!==userId)))
    const offDm=onWS('dm',msg=>{
      if(!dmUser||dmUser._id!==msg.from)setDmUnread(p=>({...p,[msg.from]:(p[msg.from]||0)+1}))
    })
    const offTyping=onWS('typing_public',({from,fromUser})=>{
      const username=fromUser?.username||from
      setTypists(p=>{const e=p.find(t=>t.userId===from);return e?p:[...p,{userId:from,username}]})
      clearTimeout(typingRef.current)
      typingRef.current=setTimeout(()=>setTypists(p=>p.filter(t=>t.userId!==from)),3000)
    })
    const offTypingStop=onWS('stop_typing_public',({from})=>setTypists(p=>p.filter(t=>t.userId!==from)))
    return()=>{offChat();offReady();offOn();offOff();offDm();offTyping();offTypingStop()}
  },[dmUser])
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'instant'})},[messages.length])
  function handleInputChange(val){
    setInput(val)
    sendWS({type:'typing_public'})
    clearTimeout(typingRef.current)
    typingRef.current=setTimeout(()=>sendWS({type:'stop_typing_public'}),1500)
  }
  function handleFiles(e){
    const f=Array.from(e.target.files||[]).slice(0,1)[0];if(!f)return
    if(f.size>8*1024*1024){setToast('Image too large (max 8MB)');return}
    setFiles([f]);e.target.value=''
  }
  async function send(){
    const text=input.trim()
    if(!text&&!files.length)return
    const imageFile=files[0]
    setInput('');setFiles([])
    if(imageFile){
      const fd=new FormData();fd.append('content',text);fd.append('image',imageFile)
      try{await api.post('/chat',fd)}catch(e){setToast(e.response?.data?.error||'Upload failed')}
    }else{
      const id=`l-${Date.now()}`
      setMessages(p=>[...p,{_id:id,createdAt:new Date().toISOString(),author:{_id:myId,username:myUsername,avatar:myAvatar},content:text,attachments:[],pending:true}])
      sendWS({type:'chat',content:text,attachments:[]})
    }
  }
  const reportUser=useCallback(async uid=>{try{await api.post(`/messages/${uid}/report`,{});setToast('Reported to the Party. ☭')}catch{setToast('Error reporting.')}},[])
  const openDm=useCallback(u=>{setDmUser(u);setDmUnread(p=>({...p,[u._id]:0}))},[])
  const viewProfile=useCallback((uid,uname)=>navigate(`/profile/${uname||uid}`),[navigate])
  const location=useLocation()
  useEffect(()=>{if(location.state?.openDm){openDm(location.state.openDm);window.history.replaceState({},'')}},[openDm])
  const totalUnread=Object.values(dmUnread).reduce((a,b)=>a+b,0)
  const comradeIds=new Set((user?.comrades||[]).map(c=>c._id||c))
  const comradesOnline=onlineUsers.filter(u=>comradeIds.has(u._id)&&u._id!==myId)
  const othersOnline=onlineUsers.filter(u=>!comradeIds.has(u._id)&&u._id!==myId)
  return(
    <div className="chat-layout">
      <div className="chat-center">
        <div className="chat-header">
          <span className="chat-header-title">☭ PUBLIC CHANNEL</span>
          <span className="chat-header-online"><span className="online-dot"/>{onlineUsers.length} online</span>
        </div>
        <div className="chat-stream">
          {messages.length===0&&<div className="empty">State channel is silent.</div>}
          {messages.map((m,i)=>{
            const mine=(m.author?._id||m.author)===myId
            const username=mine?myUsername:(m.author?.username||'Citizen')
            const col=uc(username)
            const av=m.author?.avatar
            const grouped=isGrouped(m,messages[i-1])
            if(grouped)return(
              <div key={m._id} className={`dc-cont${m.pending?' pending':''}`}>
                <span className="dc-hover-ts">{timeStr(m.createdAt)}</span>
                <div className="dc-text">{m.content}</div>
                {!!m.attachments?.length&&<div className="chat-attachments">{m.attachments.map((a,j)=>a?.url&&((a.type||'').startsWith('image/')?<img key={j} src={a.url} alt="" className="chat-img" loading="lazy" onClick={()=>setLb(a.url)}/>:<a key={j} href={a.url} download={a.name||'file'} className="chat-file-link">{a.name||'file'}</a>))}</div>}
              </div>
            )
            return(
              <div key={m._id} className={`dc-msg${m.pending?' pending':''}`}>
                <div className="dc-avatar" style={{background:av?'transparent':col,cursor:'pointer'}} onClick={()=>!mine&&m.author?.username&&viewProfile(m.author._id,m.author.username)}>
                  {av?<img src={av} alt="" loading="lazy"/>:username[0]?.toUpperCase()}
                </div>
                <div className="dc-content">
                  <div className="dc-meta">
                    <span className={`dc-username${m.author?.isAdmin?' admin-name':''}`} style={{color:m.author?.isAdmin?'var(--gold)':col,cursor:mine?'default':'pointer'}} onClick={()=>!mine&&m.author?.username&&viewProfile(m.author._id,m.author.username)}>{username}</span>
                    <span className="dc-time">{timeStr(m.createdAt)}</span>
                    {m.pending&&<span className="dc-sending">sending…</span>}
                    {!mine&&m.author?._id&&<button className="ghost" style={{fontSize:11,padding:'2px 6px',marginLeft:4,color:'var(--muted)'}} onClick={()=>openDm(m.author)}>DM</button>}
                  </div>
                  <div className={`dc-text${m.author?.isAdmin?' dc-admin-msg':''}`}>{m.content}</div>
                  {!!m.attachments?.length&&<div className="chat-attachments">{m.attachments.map((a,j)=>a?.url&&((a.type||'').startsWith('image/')?<img key={j} src={a.url} alt="" className="chat-img" loading="lazy" onClick={()=>setLb(a.url)}/>:<a key={j} href={a.url} download={a.name||'file'} className="chat-file-link">{a.name||'file'}</a>))}</div>}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef}/>
        </div>
        <TypingBar typists={typists} myId={myId}/>
        {files.length>0&&(
          <div className="file-preview-strip">
            {files.map((f,i)=><div key={i} className="file-chip">{f.name}<button onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))}>✕</button></div>)}
          </div>
        )}
        <div className="chat-compose">
          <input ref={fileRef} type="file" style={{display:'none'}} onChange={handleFiles}/>
          <textarea value={input} onChange={e=>handleInputChange(e.target.value)} placeholder="Speak, citizen…" onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())} rows={1}/>
          <button className={`attach-btn${files.length?' has-file':''}`} onClick={()=>fileRef.current?.click()} title="Attach image">+</button>
          <button className="send-btn" onClick={send}>↑</button>
        </div>
      </div>
      <div className="chat-right">
        <div className="rp-title">ONLINE{totalUnread>0&&<span className="rp-unread-total">{totalUnread}</span>}<span className="rp-count">{onlineUsers.length}</span></div>
        {comradesOnline.length>0&&(
          <>
            <div style={{padding:'4px 10px 2px',fontSize:10,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase'}}>Comrades</div>
            {comradesOnline.map(u=>(
              <button key={u._id} className="rp-item-btn" onClick={()=>openDm(u)}>
                <span className="rp-dot" style={{background:'var(--cyan)'}}/>
                <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</span>
                {dmUnread[u._id]>0&&<span className="rp-unread">{dmUnread[u._id]}</span>}
              </button>
            ))}
            {othersOnline.length>0&&<div style={{padding:'4px 10px 2px',fontSize:10,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',marginTop:4}}>Others</div>}
          </>
        )}
        {othersOnline.map(u=>(
          <button key={u._id} className="rp-item-btn" onClick={()=>openDm(u)}>
            <span className="rp-dot" style={{background:'var(--green)'}}/>
            <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username}</span>
            {dmUnread[u._id]>0&&<span className="rp-unread">{dmUnread[u._id]}</span>}
          </button>
        ))}
        {onlineUsers.length===0&&<div style={{padding:'8px 10px',color:'var(--muted)',fontSize:12}}>No citizens online.</div>}
        <div className="rp-sep"/>
        <button className="rp-report-btn" onClick={()=>setToast('Activity reported to the Party.')}>☭ Report Activity</button>
      </div>
      {dmUser&&<DmModal user={dmUser} myId={myId} myUsername={myUsername} myAvatar={myAvatar} onClose={()=>setDmUser(null)} onReport={reportUser}/>}
      {lb&&<Lightbox src={lb} onClose={()=>setLb(null)}/>}
      {toast&&<div className="toast">{toast}<button className="ghost" onClick={()=>setToast(null)}>✕</button></div>}
    </div>
  )
}

import{useCallback,useEffect,useRef,useState}from'react'
import{useSelector}from'react-redux'
import{sendWS,onWS}from'../ws'
import api from'../api'
export default function Messages(){
  const[convos,setConvos]=useState([])
  const[active,setActive]=useState(null)
  const[messages,setMessages]=useState([])
  const[input,setInput]=useState('')
  const[loading,setLoading]=useState(true)
  const[typing,setTyping]=useState(false)
  const bottomRef=useRef(null)
  const typingTimer=useRef(null)
  const myId=useSelector(s=>s.auth.user?._id)
  const loadConvos=useCallback(async()=>{
    try{const{data}=await api.get('/messages');setConvos(data)}catch{}
  },[])
  useEffect(()=>{
    loadConvos().finally(()=>setLoading(false))
    const id=setInterval(loadConvos,30000)
    return()=>clearInterval(id)
  },[loadConvos])
  useEffect(()=>{
    if(!active?._id)return
    let cancelled=false
    api.get(`/messages/${active._id}`).then(({data})=>{if(!cancelled)setMessages(data)}).catch(()=>{})
    return()=>{cancelled=true}
  },[active?._id])
  useEffect(()=>{
    const offDm=onWS('dm',msg=>{
      if(msg.from===active?._id){
        const m={_id:msg.dbId||msg.id,from:{_id:msg.from,username:msg.fromUser?.username||'',avatar:msg.fromUser?.avatar||''},content:msg.content,createdAt:new Date(msg.ts||Date.now()).toISOString(),read:false}
        setMessages(p=>{if(p.some(x=>x._id===m._id))return p;return[...p,m]})
        sendWS({type:'read_dm',from:msg.from})
      }else{
        loadConvos()
      }
    })
    const offSent=onWS('dm_sent',(msg)=>{
      setMessages(p=>p.map(m=>m._id===msg.id?{...m,_id:msg.dbId||m._id,pending:false}:m))
    })
    const offTyping=onWS('typing_dm',msg=>{if(msg.from===active?._id)setTyping(true)})
    const offStop=onWS('stop_typing_dm',msg=>{if(msg.from===active?._id)setTyping(false)})
    return()=>{offDm();offSent();offTyping();offStop()}
  },[active?._id,loadConvos])
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'instant'})},[messages.length])
  function handleInput(val){
    setInput(val)
    if(active?._id){
      sendWS({type:'typing_dm',to:active._id})
      clearTimeout(typingTimer.current)
      typingTimer.current=setTimeout(()=>{},1500)
    }
  }
  async function send(){
    const text=input.trim()
    if(!text||!active?._id)return
    const tempId=`l-${Date.now()}`
    const opt={_id:tempId,from:{_id:myId},content:text,pending:true,createdAt:new Date().toISOString()}
    setMessages(p=>[...p,opt])
    setInput('')
    sendWS({type:'dm',id:tempId,to:active._id,content:text})
  }
  async function reportMessage(msgId){
    if(!active?._id)return
    try{await api.post(`/messages/${active._id}/report`,{messageId:msgId})}catch{}
  }
  const totalUnread=convos.reduce((a,c)=>a+(c.unread||0),0)
  function timeStr(d){if(!d)return'';return new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
  return(
    <div style={{height:'100vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div className="ph" style={{margin:0,padding:'8px 14px',flexShrink:0}}>
        <div>
          <h2>Direct Messages {totalUnread>0&&<span className="badge" style={{background:'var(--accent)',color:'#111',fontSize:13}}>{totalUnread}</span>}</h2>
          <p>Private channels. Enter sends.</p>
        </div>
      </div>
      <div className="dm-layout" style={{flex:1}}>
        <div className="dm-list">
          {loading&&<div className="loading" style={{padding:20}}>Loading...</div>}
          {!loading&&convos.length===0&&<div className="empty" style={{padding:20}}>No chats yet.</div>}
          {convos.map(c=>(
            <button key={c.partner._id} className={`dm-user${active?._id===c.partner._id?' active':''}`}
              onClick={()=>{setActive(c.partner);setMessages([]);setTyping(false)}}>
              <span style={{display:'flex',alignItems:'center',gap:6,flex:1,minWidth:0}}>
                <div style={{width:24,height:24,borderRadius:'50%',overflow:'hidden',flexShrink:0,background:'var(--surf3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>
                  {c.partner.avatar?<img src={c.partner.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:c.partner.username[0]?.toUpperCase()}
                </div>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.partner.username}</span>
              </span>
              {!!c.unread&&<span className="badge" style={{background:'var(--accent)',color:'#111'}}>{c.unread}</span>}
            </button>
          ))}
        </div>
        <div className="dm-chat">
          {!active&&<div className="empty">Select a citizen.</div>}
          {active&&(
            <>
              <div className="dm-head">
                <span className="dm-title">
                  {active.avatar&&<img src={active.avatar} alt="" style={{width:22,height:22,objectFit:'cover',borderRadius:'50%'}}/>}
                  ☭ {active.username}
                </span>
                <button className="ghost" style={{fontSize:13,color:'var(--red)'}}
                  onClick={()=>messages[messages.length-1]?._id&&reportMessage(messages[messages.length-1]._id)}>
                  ☭ report
                </button>
              </div>
              <div className="dm-messages" style={{flex:1,overflow:'auto'}}>
                {messages.length===0&&<div className="empty">No messages yet.</div>}
                {messages.map((m,i)=>{
                  const mine=(m.from?._id||m.from)===myId
                  const prev=messages[i-1]
                  const grouped=prev&&(prev.from?._id||prev.from)===(m.from?._id||m.from)&&new Date(m.createdAt)-new Date(prev.createdAt)<300000
                  if(grouped)return(
                    <div key={m._id} className={`dc-cont${m.pending?' pending':''}`}>
                      <span className="dc-hover-ts">{timeStr(m.createdAt)}</span>
                      <div className="dc-text" style={{fontSize:15}}>{m.content}</div>
                    </div>
                  )
                  const who=mine?'You':active.username
                  const av=mine?undefined:active.avatar
                  const col=mine?'var(--accent)':'var(--cyan)'
                  return(
                    <div key={m._id} className={`dc-msg${m.pending?' pending':''}`} style={{padding:'3px 14px'}}>
                      <div className="dc-avatar" style={{width:28,height:28,background:av?'transparent':col,color:'#111',fontSize:12,flexShrink:0}}>
                        {av?<img src={av} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:who[0]?.toUpperCase()}
                      </div>
                      <div className="dc-content">
                        <div className="dc-meta">
                          <span className="dc-username" style={{color:col,fontSize:13}}>{who}</span>
                          <span className="dc-time">{timeStr(m.createdAt)}</span>
                          {m.pending&&<span className="dc-sending">sending…</span>}
                          {!mine&&<button className="eye-report-btn" title="Report message" onClick={()=>reportMessage(m._id)}>☭</button>}
                        </div>
                        <div className="dc-text" style={{fontSize:15}}>{m.content}</div>
                      </div>
                    </div>
                  )
                })}
                {typing&&(
                  <div style={{padding:'4px 14px',display:'flex',alignItems:'center',gap:8}}>
                    <EyeTyping/>
                    <span style={{fontSize:12,color:'var(--muted)'}}>{active.username} is typing…</span>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>
              <div className="dm-compose">
                <textarea value={input} onChange={e=>handleInput(e.target.value)}
                  placeholder={`Message ${active.username}… (Enter to send)`}
                  onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())}
                  rows={1} autoFocus/>
                <button className="send-btn" onClick={send}>↑</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
function EyeTyping(){
  return(
    <svg width="28" height="18" viewBox="0 0 28 18" style={{flexShrink:0}}>
      <ellipse cx="14" cy="9" rx="13" ry="8" fill="white" stroke="var(--border)" strokeWidth="1"/>
      <circle cx="14" cy="12" r="4" fill="#1a1a1a"/>
      <circle cx="14" cy="12" r="2.2" fill="var(--accent)"/>
      <circle cx="15.2" cy="11" r=".9" fill="rgba(255,255,255,.6)"/>
    </svg>
  )
}

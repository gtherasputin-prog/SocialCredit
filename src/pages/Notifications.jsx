import{useEffect,useState,useCallback}from'react'
import{useNavigate}from'react-router-dom'
import{onWS}from'../ws'
import api from'../api'
const icons={upvote:'⬆',downvote:'⬇',report:'☭',comrade:'🤝',group:'🏴',messageReport:'👁',admin_warning:'⚠',admin_jail:'⛓',system:'🔔'}
const labels={upvote:'Social Credit +1',downvote:'Social Credit -1',report:'reported your post',comrade:'sent a comrade request',group:'added you to a collective',messageReport:'reported your message',admin_warning:'Official Warning',admin_jail:'Sentenced to the Gulag',system:'System Notification'}
function timeAgo(d){const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return'just now';if(s<3600)return`${Math.floor(s/60)}m ago`;if(s<86400)return`${Math.floor(s/3600)}h ago`;return`${Math.floor(s/86400)}d ago`}
function groupNotifs(notes){
  const grouped=[];const map={};
  for(const n of notes){
    const key=`${n.type}_${n.post?._id||'none'}`;
    if(['upvote','downvote','comrade'].includes(n.type)&&map[key]&&(Date.now()-new Date(map[key].latest))<3600000){
      const g=map[key];g.senders.push(n.sender);g.count++;g.latest=n.createdAt;if(!n.read)g.read=false
    }else{
      const g={_id:n._id,type:n.type,post:n.post,message:n.message,senders:[n.sender].filter(Boolean),count:1,latest:n.createdAt,read:n.read}
      grouped.push(g);map[key]=g
    }
  }
  return grouped
}
function NotifItem({n,navigate}){
  const[expanded,setExpanded]=useState(false)
  const isAdmin=n.type==='admin_warning'||n.type==='admin_jail'
  const isVote=n.type==='upvote'||n.type==='downvote'
  return(
    <div className={`notif${n.read?'':' unread'}${isAdmin?' admin-warning-notif':''}`} style={{cursor:n.post?'pointer':'default'}} onClick={()=>n.post&&navigate(`/`)}>
      <span className="notif-icon">{icons[n.type]||'🔔'}</span>
      <div className="notif-body">
        {n.message?<div className="notif-text"><strong>{labels[n.type]||n.type}:</strong> {n.message}</div>:(
          <div className="notif-text">
            {n.senders.length>0&&(
              <span>
                {n.count>1&&!expanded?(
                  <><strong>{n.senders[0]?.username||'Someone'}</strong> and <button className="notif-expand-btn" onClick={e=>{e.stopPropagation();setExpanded(true)}}>{n.count-1} others</button></>
                ):(
                  n.senders.map((s,i)=>(
                    <span key={i}><strong style={{cursor:'pointer'}} onClick={e=>{e.stopPropagation();s&&navigate(`/profile/${s._id}`)}}>{s?.username||'?'}</strong>{i<n.senders.length-1&&', '}</span>
                  ))
                )}
                {' '}{labels[n.type]||n.type}
                {n.count>1&&<span className="notif-count">×{n.count}</span>}
              </span>
            )}
          </div>
        )}
        {n.post?.content&&<div className="notif-sub">"{n.post.content.slice(0,60)}{n.post.content.length>60?'...':''}"</div>}
        <div className="notif-time">{timeAgo(n.latest||n.createdAt)}</div>
      </div>
    </div>
  )
}
export default function Notifications(){
  const[notes,setNotes]=useState([])
  const[loading,setLoading]=useState(true)
  const navigate=useNavigate()
  useEffect(()=>{
    api.get('/notifications').then(({data})=>{setNotes(data);setLoading(false)})
    api.put('/notifications/read').catch(()=>{})
  },[])
  useEffect(()=>{
    const off=onWS('notification',n=>{
      setNotes(prev=>[{...n,_id:Date.now(),read:false,latest:new Date().toISOString()},...prev])
    })
    return off
  },[])
  const grouped=groupNotifs(notes)
  if(loading)return<div className="page"><div className="loading">Retrieving Party transmissions...</div></div>
  return(
    <div className="page">
      <div className="ph">
        <div><h2>🔔 Alerts</h2><p>The Party has been observing your activity.</p></div>
        {notes.length>0&&<button className="ghost" onClick={()=>api.put('/notifications/read').then(()=>setNotes(p=>p.map(n=>({...n,read:true}))))}>Mark all read</button>}
      </div>
      {grouped.length===0&&<div className="empty">No alerts. The Party is pleased.</div>}
      {grouped.map((n,i)=><NotifItem key={n._id||i} n={n} navigate={navigate}/>)}
    </div>
  )
}
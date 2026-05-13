import{useEffect,useRef,useState,useCallback}from'react'
import api from'../api'
import Post from'../components/Post'
import PostForm from'../components/PostForm'
import PostSkeleton from'../components/PostSkeleton'
const PAGE_SIZE=20
const SKELETONS=Array.from({length:5},(_,i)=>i)
export default function Smugglers(){
  const[entered,setEntered]=useState(false)
  const[posts,setPosts]=useState([])
  const[loading,setLoading]=useState(false)
  const[hasMore,setHasMore]=useState(true)
  const[toast,setToast]=useState(null)
  const sentinelRef=useRef(null)
  const loadingMore=useRef(false)
  useEffect(()=>{
    if(!entered)return
    setLoading(true)
    const ac=new AbortController()
    api.get('/posts?area=smugglers',{signal:ac.signal})
      .then(({data})=>{setPosts(data);setHasMore(data.length===PAGE_SIZE)})
      .catch(e=>{if(e.code!=='ERR_CANCELED'){}})
      .finally(()=>setLoading(false))
    return()=>ac.abort()
  },[entered])
  const loadMore=useCallback(async()=>{
    if(loadingMore.current||!hasMore)return
    const oldest=posts[posts.length-1]?.createdAt;if(!oldest)return
    loadingMore.current=true
    try{
      const{data}=await api.get(`/posts?area=smugglers&before=${encodeURIComponent(oldest)}`)
      setPosts(prev=>{const ids=new Set(prev.map(p=>p._id));return[...prev,...data.filter(p=>!ids.has(p._id))]})
      setHasMore(data.length===PAGE_SIZE)
    }catch{}
    loadingMore.current=false
  },[posts,hasMore])
  useEffect(()=>{
    if(!sentinelRef.current)return
    const obs=new IntersectionObserver(entries=>{if(entries[0].isIntersecting)loadMore()},{threshold:0.1})
    obs.observe(sentinelRef.current)
    return()=>obs.disconnect()
  },[loadMore])
  if(!entered)return(
    <div className="smugglers-gate">
      <div className="sg-content">
        <div className="sg-skull">☠</div>
        <h1 className="sg-title">DANGER ZONE</h1>
        <div className="sg-divider"/>
        <h2 className="sg-sub">SMUGGLERS' DEN</h2>
        <div className="sg-warnings">
          <div className="sg-warning-item">⚠ Content is unmoderated and unfiltered</div>
          <div className="sg-warning-item">⚠ You remain personally accountable</div>
          <div className="sg-warning-item">⚠ The Commissariat logs all entries</div>
          <div className="sg-warning-item">⚠ Violations are still punishable</div>
        </div>
        <p className="sg-disclaimer">By entering, you accept full responsibility for your actions within this zone.</p>
        <button className="sg-enter-btn" onClick={()=>setEntered(true)}>
          <span className="sg-btn-skull">☠</span>
          ENTER THE DEN — I ACCEPT
          <span className="sg-btn-skull">☠</span>
        </button>
        <button className="sg-back" onClick={()=>window.history.back()}>← Retreat to Safety</button>
      </div>
    </div>
  )
  return(
    <div className="page smugglers-page">
      <div className="ph">
        <div><h2>☠ Smugglers' Den</h2><p>The underground. Proceed with caution.</p></div>
      </div>
      <PostForm area="smugglers" onPost={p=>setPosts(prev=>[p,...prev])} onToast={setToast}/>
      {toast&&<div className="toast">{toast}<button className="ghost" onClick={()=>setToast(null)}>✕</button></div>}
      {loading&&SKELETONS.map(i=><PostSkeleton key={i}/>)}
      {!loading&&posts.length===0&&(
        <div className="empty-state smug-empty">
          <div className="es-icon">☠</div>
          <div className="es-title">EMPTY DEN</div>
          <div className="es-sub">Nothing here yet.</div>
        </div>
      )}
      {posts.map(p=><Post key={p._id} post={p} onDelete={id=>setPosts(prev=>prev.filter(x=>x._id!==id))} onToast={setToast}/>)}
      {hasMore&&<div ref={sentinelRef} style={{height:1}}/>}
    </div>
  )
}
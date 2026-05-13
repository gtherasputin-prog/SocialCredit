import{useEffect,useRef,useState,useCallback}from'react'
import{useSelector}from'react-redux'
import{useNavigate}from'react-router-dom'
import api from'../api'
import Post from'../components/Post'
import PostForm from'../components/PostForm'
import PostSkeleton from'../components/PostSkeleton'
const PAGE_SIZE=20
const SKELETONS=Array.from({length:5},(_,i)=>i)
export default function Jail(){
  const user=useSelector(s=>s.auth.user)
  const navigate=useNavigate()
  const[posts,setPosts]=useState([])
  const[loading,setLoading]=useState(true)
  const[hasMore,setHasMore]=useState(true)
  const[toast,setToast]=useState(null)
  const sentinelRef=useRef(null)
  const loadingMore=useRef(false)
  const score=user?.creditScore??999
  const isJailed=user?.jailed||score<=50
  useEffect(()=>{
    if(!isJailed)return
    const ac=new AbortController()
    api.get('/posts?area=jail',{signal:ac.signal})
      .then(({data})=>{setPosts(data);setHasMore(data.length===PAGE_SIZE)})
      .catch(e=>{if(e.code!=='ERR_CANCELED'){}})
      .finally(()=>setLoading(false))
    return()=>ac.abort()
  },[isJailed])
  const loadMore=useCallback(async()=>{
    if(loadingMore.current||!hasMore)return
    const oldest=posts[posts.length-1]?.createdAt;if(!oldest)return
    loadingMore.current=true
    try{
      const{data}=await api.get(`/posts?area=jail&before=${encodeURIComponent(oldest)}`)
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
  if(!isJailed)return(
    <div className="error-page">
      <div className="error-content">
        <div className="error-code" style={{color:'var(--red)'}}>403</div>
        <div className="error-star">🔒</div>
        <h1 className="error-title" style={{color:'var(--red)'}}>JAIL ACCESS DENIED</h1>
        <p className="error-sub">Your score is too high to enter.<br/>Only citizens with score ≤50 may be here.<br/><strong style={{color:'var(--gold)'}}>Your score: ★ {score}</strong></p>
        <div className="error-actions">
          <button className="primary" onClick={()=>navigate('/')}>← Return to Feed</button>
        </div>
      </div>
      <div className="error-scanlines"/>
    </div>
  )
  return(
    <div className="page jail-page">
      <div className="jail-banner">
        <div className="jail-bars">{'|'.repeat(10)}</div>
        <div className="jail-banner-text">
          <h2>⛓ JAIL ⛓</h2>
          <p>You are confined. Post here. Nowhere else.</p>
        </div>
        <div className="jail-bars">{'|'.repeat(10)}</div>
      </div>
      <PostForm area="jail" onPost={p=>setPosts(prev=>[p,...prev])} onToast={setToast}/>
      {toast&&<div className="toast">{toast}<button className="ghost" onClick={()=>setToast(null)}>✕</button></div>}
      {loading&&SKELETONS.map(i=><PostSkeleton key={i}/>)}
      {!loading&&posts.length===0&&(
        <div className="empty-state jail-empty">
          <div className="es-icon">⛓</div>
          <div className="es-title">SILENCE</div>
          <div className="es-sub">No confessions yet.</div>
        </div>
      )}
      {posts.map(p=><Post key={p._id} post={p} onDelete={id=>setPosts(prev=>prev.filter(x=>x._id!==id))} onToast={setToast}/>)}
      {hasMore&&<div ref={sentinelRef} style={{height:1}}/>}
    </div>
  )
}
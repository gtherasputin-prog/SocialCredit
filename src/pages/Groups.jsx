import{useEffect,useState,useCallback}from'react'
import{useSelector}from'react-redux'
import api from'../api'
import Post from'../components/Post'
import PostForm from'../components/PostForm'
export default function Groups(){
  const me=useSelector(s=>s.auth.user)
  const score=me?.creditScore??0
  const canCreate=score>=100
  const canCreateMultiple=score>=200
  const[groups,setGroups]=useState([])
  const[active,setActive]=useState(null)
  const[posts,setPosts]=useState([])
  const[creating,setCreating]=useState(false)
  const[form,setForm]=useState({name:'',description:''})
  const[loading,setLoading]=useState(true)
  const[joined,setJoined]=useState({})
  const[joinedSet,setJoinedSet]=useState(()=>new Set())
  const[renaming,setRenaming]=useState(null)
  const[renameVal,setRenameVal]=useState('')
  const myGroups=groups.filter(g=>(g.creator?._id||g.creator)===me?._id)
  useEffect(()=>{
    const ac=new AbortController()
    api.get('/groups',{signal:ac.signal})
      .then(({data})=>{
        setGroups(data)
        setJoinedSet(new Set(data.filter(g=>g.members?.some(m=>(m._id||m)===me?._id)).map(g=>g._id)))
        setLoading(false)
      })
      .catch(e=>{if(e.code!=='ERR_CANCELED')setLoading(false)})
    return()=>ac.abort()
  },[])
  const openGroup=useCallback(async g=>{setActive(g);const{data}=await api.get(`/posts?area=public&group=${g._id}`);setPosts(data)},[])
  const join=useCallback(async(g,e)=>{e.stopPropagation();const{data}=await api.post(`/groups/${g._id}/join`);setJoined(prev=>({...prev,[g._id]:data.members}));setJoinedSet(prev=>{const s=new Set(prev);data.isMember?s.add(g._id):s.delete(g._id);return s})},[])
  const create=useCallback(async()=>{
    if(!form.name.trim())return
    if(!canCreate){alert(`You need ≥100 Social Credit to create a collective. Yours: ${score}`);return}
    if(myGroups.length>=1&&!canCreateMultiple){alert('You need ≥200 Social Credit to create multiple collectives.');return}
    try{const{data}=await api.post('/groups',form);setGroups(prev=>[data,...prev]);setCreating(false);setForm({name:'',description:''})}
    catch(e){alert(e.response?.data?.error||'Error')}
  },[form,canCreate,canCreateMultiple,myGroups.length,score])
  const deleteGroup=useCallback(async id=>{
    if(!confirm('Delete this collective permanently?'))return
    try{await api.delete(`/groups/${id}`);setGroups(p=>p.filter(g=>g._id!==id));if(active?._id===id){setActive(null);setPosts([])}}
    catch(e){alert(e.response?.data?.error||'Error')}
  },[active])
  const renameGroup=useCallback(async(id)=>{
    if(!renameVal.trim())return
    try{const{data}=await api.put(`/groups/${id}`,{name:renameVal});setGroups(p=>p.map(g=>g._id===id?{...g,name:data.name}:g));if(active?._id===id)setActive(a=>({...a,name:data.name}));setRenaming(null);setRenameVal('')}
    catch(e){alert(e.response?.data?.error||'Error')}
  },[renameVal,active])
  const reportGroup=useCallback(async id=>{try{await api.post(`/groups/${id}/report`,{reason:'Reported by user'})}catch{}},[])
  if(active)return(
    <div className="page">
      <div className="ph">
        <div>
          <h2>🏴 {active.name}</h2>
          <p>{active.description}{active.creator?.username&&<span style={{color:'var(--muted)',fontSize:11}}> · created by {active.creator.username}</span>}</p>
        </div>
        <button onClick={()=>{setActive(null);setPosts([])}}>← Back</button>
      </div>
      <PostForm area="public" group={active._id} onPost={p=>setPosts(prev=>[p,...prev])}/>
      {posts.map(p=><Post key={p._id} post={p} onDelete={id=>setPosts(prev=>prev.filter(x=>x._id!==id))}/>)}
      {posts.length===0&&<div className="empty">No posts in this collective yet.</div>}
    </div>
  )
  return(
    <div className="page">
      <div className="ph">
        <div><h2>Collectives</h2><p>Organized units of the Party. Need ★100 to create.</p></div>
        {canCreate&&<button className="primary" onClick={()=>setCreating(v=>!v)}>+ New</button>}
      </div>
      {!canCreate&&<div className="card" style={{borderColor:'var(--gold)',marginBottom:16}}><p style={{color:'var(--gold)',fontSize:13}}>★ You need 100 Social Credit to create a collective. Current: <strong>{score}</strong></p></div>}
      {creating&&(
        <div className="pf" style={{marginBottom:14}}>
          <div className="fg"><label>Name</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Collective name"/></div>
          <div className="fg"><label>Description</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Purpose..."/></div>
          <div style={{display:'flex',gap:8}}>
            <button className="primary" onClick={create}>Create Collective</button>
            <button className="ghost" onClick={()=>setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}
      {loading&&<div className="loading">Loading collectives...</div>}
      {groups.map(g=>{
        const isCreator=(g.creator?._id||g.creator)===me?._id
        return(
          <div className="gc" key={g._id}>
            {renaming===g._id?(
              <div style={{flex:1,display:'flex',gap:8,padding:'8px 0'}}>
                <input value={renameVal} onChange={e=>setRenameVal(e.target.value)} className="comm-text-input" placeholder="New name..." autoFocus onKeyDown={e=>e.key==='Enter'&&renameGroup(g._id)}/>
                <button className="primary" onClick={()=>renameGroup(g._id)}>Save</button>
                <button className="ghost" onClick={()=>setRenaming(null)}>✕</button>
              </div>
            ):(
              <div className="gc-info" onClick={()=>openGroup(g)}>
                <h3>🏴 {g.name}{g.creator?.username&&<span style={{color:'var(--muted)',fontSize:11,marginLeft:8}}>by {g.creator.username}</span>}</h3>
                <p>{g.description||'No description.'} · {joined[g._id]??g.members?.length??0} members</p>
              </div>
            )}
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              <button className={joinedSet.has(g._id)?'ghost':'primary'} onClick={e=>join(g,e)}>{joinedSet.has(g._id)?'✓ Joined':'Join'}</button>
              {isCreator&&renaming!==g._id&&(
                <>
                  <button className="ghost" style={{fontSize:12}} onClick={e=>{e.stopPropagation();setRenaming(g._id);setRenameVal(g.name)}}>✏</button>
                  <button className="ghost" style={{fontSize:12,color:'var(--accent)'}} onClick={e=>{e.stopPropagation();deleteGroup(g._id)}}>🗑</button>
                </>
              )}
              {!isCreator&&<button className="ghost" style={{fontSize:11,color:'var(--muted)'}} onClick={e=>{e.stopPropagation();reportGroup(g._id)}}>Report</button>}
            </div>
          </div>
        )
      })}
      {!loading&&groups.length===0&&<div className="empty">No collectives formed yet.</div>}
    </div>
  )
}
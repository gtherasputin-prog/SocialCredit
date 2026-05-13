import{useEffect,useState,useCallback,useRef}from'react'
import{useParams,useNavigate}from'react-router-dom'
import{useSelector,useDispatch}from'react-redux'
import api from'../api'
import Post from'../components/Post'
import{setUser}from'../slices/authSlice'
export default function Profile(){
  const{username}=useParams()
  const navigate=useNavigate()
  const me=useSelector(s=>s.auth.user)
  const dispatch=useDispatch()
  const[profile,setProfile]=useState(null)
  const[posts,setPosts]=useState([])
  const[postsLoading,setPostsLoading]=useState(true)
  const[editing,setEditing]=useState(false)
  const[form,setForm]=useState({bio:'',username:'',avatarUrl:''})
  const[avatarFile,setAvatarFile]=useState(null)
  const[avatarPreview,setAvatarPreview]=useState('')
  const[comradeState,setComradeState]=useState({is:false,count:0})
  const[saving,setSaving]=useState(false)
  const[avatarMode,setAvatarMode]=useState('file')
  const fileRef=useRef(null)
  const isMe=me?.username===username
  useEffect(()=>{
    const ac=new AbortController()
    setProfile(null);setPostsLoading(true)
    api.get(`/users/u/${username}`,{signal:ac.signal})
      .then(({data:u})=>{
        setProfile(u)
        setForm({bio:u.bio||'',username:u.username,avatarUrl:''})
        setComradeState({is:u.comrades?.some(c=>(c._id||c)===me?._id),count:u.comrades?.length||0})
        return api.get(`/posts?area=public&author=${u._id}`,{signal:ac.signal})
      })
      .then(({data:p})=>setPosts(p))
      .catch(e=>{if(e.code!=='ERR_CANCELED')console.error(e)})
      .finally(()=>setPostsLoading(false))
    return()=>ac.abort()
  },[username,me?._id])
  function handleAvatarFile(e){
    const file=e.target.files?.[0];if(!file)return
    if(!file.type.startsWith('image/'))return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    e.target.value=''
  }
  const save=useCallback(async()=>{
    setSaving(true)
    try{
      const fd=new FormData()
      fd.append('bio',form.bio)
      fd.append('username',form.username)
      if(avatarFile)fd.append('avatar',avatarFile)
      else if(form.avatarUrl&&form.avatarUrl.startsWith('http'))fd.append('avatarUrl',form.avatarUrl)
      const{data:updated}=await api.put('/users/me',fd)
      setProfile(d=>({...d,...updated}))
      dispatch(setUser(updated))
      setEditing(false)
      setAvatarFile(null)
      setAvatarPreview('')
      setForm(f=>({...f,avatarUrl:''}))
      if(updated.username!==username)navigate(`/profile/${updated.username}`,{replace:true})
    }catch(e){alert(e.response?.data?.error||'Error')}
    setSaving(false)
  },[form,avatarFile,dispatch,username,navigate])
  const toggleComrade=useCallback(async()=>{
    const prev=comradeState
    setComradeState(s=>({is:!s.is,count:s.count+(s.is?-1:1)}))
    try{const{data:r}=await api.post(`/users/${profile._id}/comrade`);setComradeState({is:r.isComrade,count:r.comrades})}
    catch{setComradeState(prev)}
  },[profile?._id,comradeState])
  if(!profile)return<div className="page"><div className="loading">Loading citizen file...</div></div>
  const sc=profile.creditScore
  const scoreClass=sc>=150?'s-great':sc>=80?'s-ok':sc>=30?'s-warn':'s-bad'
  return(
    <div className="page">
      <div className="prof-card">
        <div className="prof-top">
          <div className="av lg" style={{cursor:isMe&&editing?'pointer':'default'}} onClick={()=>isMe&&editing&&avatarMode==='file'&&fileRef.current?.click()}>
            {(editing&&avatarPreview)?<img src={avatarPreview} alt="" loading="lazy"/>:
             profile.avatar?<img src={profile.avatar} alt="" loading="lazy"/>:'👤'}
            {isMe&&editing&&avatarMode==='file'&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.4)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>📷</div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarFile}/>
          <div style={{flex:1}}>
            {editing?(
              <>
                <div className="fg"><label>Username</label><input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}/></div>
                <div className="fg"><label>Bio</label><textarea value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))}/></div>
                <div className="tabs" style={{marginBottom:8}}>
                  <button className={`tab${avatarMode==='file'?' active':''}`} onClick={()=>setAvatarMode('file')}>Upload Photo</button>
                  <button className={`tab${avatarMode==='url'?' active':''}`} onClick={()=>setAvatarMode('url')}>Photo URL</button>
                </div>
                {avatarMode==='file'&&(
                  <div style={{fontSize:12,color:'var(--muted)',marginBottom:8}}>Click avatar to change photo</div>
                )}
                {avatarMode==='url'&&(
                  <div className="fg" style={{marginBottom:8}}>
                    <label>Avatar URL</label>
                    <input value={form.avatarUrl} onChange={e=>setForm(f=>({...f,avatarUrl:e.target.value}))} placeholder="https://example.com/avatar.jpg"/>
                    <span style={{fontSize:11,color:'var(--muted)',marginTop:3,display:'block'}}>Image will be fetched and compressed automatically</span>
                  </div>
                )}
                <div className="row">
                  <button className="primary" onClick={save} disabled={saving}>{saving?'Saving...':'Save'}</button>
                  <button onClick={()=>{setEditing(false);setAvatarFile(null);setAvatarPreview('');setForm(f=>({...f,avatarUrl:''}))}}>Cancel</button>
                </div>
              </>
            ):(
              <>
                <div className="prof-name">
                  {profile.username}
                  {profile.isAdmin&&<span className="admin-pip" style={{marginLeft:8}}>COMMISSAR</span>}
                  {profile.jailed&&<span className="jailed-chip" style={{marginLeft:8}}>JAILED</span>}
                </div>
                <div className="prof-bio">{profile.bio||'No bio provided.'}</div>
                <div className="stats">
                  <div><div className={`stat-val ${scoreClass}`}>{sc}</div><div className="stat-lbl">Credit Score</div></div>
                  <div><div className="stat-val">{comradeState.count}</div><div className="stat-lbl">Comrades</div></div>
                  <div><div className="stat-val">{posts.length}</div><div className="stat-lbl">Posts</div></div>
                </div>
                <div style={{marginTop:14,display:'flex',gap:8,flexWrap:'wrap'}}>
                  {isMe?(
                    <button onClick={()=>setEditing(true)}>Edit Profile</button>
                  ):(
                    <>
                      <button className={comradeState.is?'danger':'primary'} onClick={toggleComrade}>
                        {comradeState.is?'− Remove Comrade':'+ Add Comrade'}
                      </button>
                      <button onClick={()=>navigate('/chat',{state:{openDm:profile}})}>☭ Talk</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="ph"><h2>Posts</h2></div>
      {postsLoading&&<div className="loading">Loading posts...</div>}
      {!postsLoading&&posts.length===0&&<div className="empty">No posts on record.</div>}
      {posts.map(p=><Post key={p._id} post={p}/>)}
    </div>
  )
}

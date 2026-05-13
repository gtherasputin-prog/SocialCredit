import{useNavigate}from'react-router-dom'
import{useSelector}from'react-redux'
export default function Unauthorized(){
  const navigate=useNavigate()
  const user=useSelector(s=>s.auth.user)
  return(
    <div className="error-page unauth-page">
      <div className="error-content">
        <div className="error-code" style={{color:'var(--accent)'}}>401</div>
        <div className="error-star" style={{animation:'wiggle 2s ease-in-out infinite',color:'var(--accent)'}}>⛔</div>
        <h1 className="error-title">ACCESS DENIED</h1>
        <p className="error-sub">
          {user?`Comrade ${user.username}, you lack the clearance required to enter this area.`:'You must be authenticated to access this area.'}
          <br/>The Party does not permit unauthorized access.
        </p>
        <div className="error-actions">
          <button className="primary" onClick={()=>navigate('/')}>← Return to Feed</button>
          {!user&&<button className="ghost" onClick={()=>navigate('/auth')}>Login</button>}
        </div>
      </div>
      <div className="error-scanlines"/>
    </div>
  )
}

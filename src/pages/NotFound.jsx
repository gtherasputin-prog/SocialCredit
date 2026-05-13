import{useNavigate}from'react-router-dom'
import{useEffect,useState}from'react'
export default function NotFound(){
  const navigate=useNavigate()
  const[count,setCount]=useState(10)
  useEffect(()=>{const t=setInterval(()=>setCount(c=>{if(c<=1){clearInterval(t);navigate('/');return 0}return c-1}),1000);return()=>clearInterval(t)},[navigate])
  return(
    <div className="error-page">
      <div className="error-content">
        <div className="error-code glitch" data-text="404">404</div>
        <div className="error-star">☭</div>
        <h1 className="error-title">PAGE NOT FOUND</h1>
        <p className="error-sub">This citizen has been erased from the Party records.<br/>The page you seek does not exist — or has been purged.</p>
        <div className="error-countdown">Returning to headquarters in <strong>{count}s</strong></div>
        <div className="error-actions">
          <button className="primary" onClick={()=>navigate('/')}>← Return to Feed</button>
          <button className="ghost" onClick={()=>navigate(-1)}>Go Back</button>
        </div>
      </div>
      <div className="error-scanlines"/>
    </div>
  )
}

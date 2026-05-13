import axios from'axios'
const BASE=import.meta.env.VITE_API_URL||'http://localhost:5000/api'
const api=axios.create({baseURL:BASE})
api.interceptors.request.use(cfg=>{
  const t=localStorage.getItem('ccp_loyalty_oath')
  if(t)cfg.headers.Authorization=`Bearer ${t}`
  return cfg
})
export default api
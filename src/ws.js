let ws,token,retryT
const listeners={}
function connect(){
  const base=(import.meta.env.VITE_API_URL||'http://localhost:5000/api').replace(/\/api$/,'').replace(/^http/,'ws')
  ws=new WebSocket(`${base}/ws?token=${token}`)
  ws.onopen=()=>{}
  ws.onmessage=e=>{try{const d=JSON.parse(e.data);(listeners[d.type]||new Set()).forEach(fn=>fn(d))}catch{}}
  ws.onclose=()=>{retryT=setTimeout(connect,3000)}
  ws.onerror=()=>ws.close()
}
export function initWS(tok){if(tok&&(!ws||ws.readyState>1)){token=tok;clearTimeout(retryT);connect()}}
export function destroyWS(){clearTimeout(retryT);ws?.close();ws=null}
export function sendWS(msg){const s=JSON.stringify(msg);ws?.readyState===1?ws.send(s):null}
export function wsReady(){return ws?.readyState===1}
export function onWS(type,fn){
  if(!listeners[type])listeners[type]=new Set()
  listeners[type].add(fn)
  return()=>listeners[type]?.delete(fn)
}

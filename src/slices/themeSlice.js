import{createSlice}from'@reduxjs/toolkit'
const saved=localStorage.getItem('ccp_theme')||'dark'
const slice=createSlice({
  name:'theme',
  initialState:{mode:saved},
  reducers:{
    toggle(state){
      state.mode=state.mode==='dark'?'light':'dark'
      localStorage.setItem('ccp_theme',state.mode)
      document.documentElement.setAttribute('data-theme',state.mode)
    },
    setMode(state,{payload}){
      state.mode=payload
      localStorage.setItem('ccp_theme',payload)
      document.documentElement.setAttribute('data-theme',payload)
    },
  },
})
export const{toggle,setMode}=slice.actions
export default slice.reducer
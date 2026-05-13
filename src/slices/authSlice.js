import{createSlice,createAsyncThunk}from'@reduxjs/toolkit'
import axios from'axios'
const BASE=import.meta.env.VITE_API_URL||'http://localhost:5000/api'
/* ── Thunks ── */
export const register=createAsyncThunk('auth/register',async(data,{rejectWithValue})=>{
  try{return(await axios.post(`${BASE}/auth/register`,data)).data}
  catch(e){return rejectWithValue(e.response?.data?.error||'Registration failed')}
})
export const login=createAsyncThunk('auth/login',async(data,{rejectWithValue})=>{
  try{return(await axios.post(`${BASE}/auth/login`,data)).data}
  catch(e){return rejectWithValue(e.response?.data?.error||'Login failed')}
})
/* ── Slice ── */
const saved=localStorage.getItem('ccp_loyalty_oath')
const savedUser=localStorage.getItem('ccp_citizen_data')
const slice=createSlice({
  name:'auth',
  initialState:{token:saved||null,user:savedUser?JSON.parse(savedUser):null,loading:false,error:null},
  reducers:{
    logout(state){
      state.token=null;state.user=null
      localStorage.removeItem('ccp_loyalty_oath');localStorage.removeItem('ccp_citizen_data')
    },
    setUser(state,{payload}){
      state.user=payload
      localStorage.setItem('ccp_citizen_data',JSON.stringify(payload))
    },
    clearError(state){state.error=null},
  },
  extraReducers:b=>{
    const handle=(builder,thunk)=>{
      builder
        .addCase(thunk.pending,s=>{s.loading=true;s.error=null})
        .addCase(thunk.fulfilled,(s,{payload})=>{
          s.loading=false;s.token=payload.token;s.user=payload.user
          localStorage.setItem('ccp_loyalty_oath',payload.token)
          localStorage.setItem('ccp_citizen_data',JSON.stringify(payload.user))
        })
        .addCase(thunk.rejected,(s,{payload})=>{s.loading=false;s.error=payload})
    }
    handle(b,register);handle(b,login)
  },
})
export const{logout,setUser,clearError}=slice.actions
export default slice.reducer
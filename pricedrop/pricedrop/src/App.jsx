import { useState, useEffect, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════
   SUPABASE CLIENT
══════════════════════════════ */
const supabase = createClient(
  "https://zxpxvafmsyvrjdzgxivi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cHh2YWZtc3l2cmpkemd4aXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjA2ODUsImV4cCI6MjA4ODgzNjY4NX0.cQXgcWyfobBI0wnf-43EkM5tcNRmhy9v7-0Y68viTxU"
);

/* ══════════════════════════════
   FONTS & CSS
══════════════════════════════ */
const GFONT = "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&family=Lato:wght@300;400;700&display=swap";

const CSS = `
  @import url('${GFONT}');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #030712; --surface: #0D1117; --card: #111827;
    --border: #1F2937; --border2: #374151;
    --green: #34D399; --green-dim: rgba(52,211,153,0.1);
    --blue: #60A5FA; --purple: #A78BFA; --red: #F87171; --gold: #FBBF24;
    --text: #F9FAFB; --muted: #6B7280; --muted2: #9CA3AF;
    --serif: 'Syne', sans-serif; --mono: 'JetBrains Mono', monospace; --body: 'Lato', sans-serif;
  }
  html, body { background: var(--bg); color: var(--text); font-family: var(--body); }
  button, input, select { font-family: var(--body); }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px) scale(.96)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes authIn  { from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes bgFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.04)} }

  .page      { animation: fadeUp .32s cubic-bezier(.4,0,.2,1) both; }
  .overlay   { animation: fadeIn .2s ease both; }
  .modal     { animation: fadeUp .28s cubic-bezier(.34,1.4,.64,1) both; }
  .auth-card { animation: authIn .4s cubic-bezier(.34,1.2,.64,1) both; }

  .card { background:var(--card); border:1px solid var(--border); border-radius:16px; transition:border-color .2s,transform .2s,box-shadow .2s; }
  .card:hover { border-color:var(--border2); transform:translateY(-2px); box-shadow:0 12px 40px rgba(0,0,0,.4); }

  .btn { border:none; cursor:pointer; font-family:var(--serif); font-weight:700; letter-spacing:-.01em; transition:all .15s; border-radius:10px; display:flex; align-items:center; justify-content:center; gap:8px; }
  .btn-green { background:var(--green); color:#030712; padding:13px 28px; font-size:14px; }
  .btn-green:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); }
  .btn-green:disabled { opacity:.45; cursor:not-allowed; }
  .btn-ghost { background:transparent; color:var(--muted2); border:1.5px solid var(--border); padding:12px 20px; font-size:13px; }
  .btn-ghost:hover { border-color:var(--border2); color:var(--text); }
  .btn-sm { padding:8px 16px; font-size:12px; border-radius:8px; }
  .btn-danger { background:rgba(248,113,113,.1); color:var(--red); border:1px solid rgba(248,113,113,.2); padding:10px 20px; font-size:13px; border-radius:10px; }
  .btn-danger:hover { background:rgba(248,113,113,.2); }

  .input { background:var(--surface); border:1.5px solid var(--border); border-radius:10px; color:var(--text); padding:13px 16px; font-size:14px; width:100%; outline:none; transition:border-color .15s; }
  .input:focus { border-color:var(--green); }
  .input.err { border-color:var(--red); }
  .input-wrap { position:relative; }
  .eye { position:absolute; right:14px; top:50%; transform:translateY(-50%); cursor:pointer; color:var(--muted); font-size:13px; user-select:none; }

  .nav-btn { background:none; border:none; cursor:pointer; font-family:var(--serif); font-size:13px; font-weight:500; padding:8px 16px; border-radius:8px; transition:all .15s; }
  .pulse-dot { width:8px; height:8px; border-radius:50%; background:var(--green); animation:pulse 2s infinite; }
  .spinner { width:18px; height:18px; border:2px solid rgba(3,7,18,.3); border-top-color:#030712; border-radius:50%; animation:spin .6s linear infinite; }
  .glow { box-shadow:0 0 0 1px rgba(52,211,153,.3),0 0 24px rgba(52,211,153,.1); }

  ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
  select option{background:#111827}
`;

/* ══════════════════════════════
   AUTH CONTEXT
══════════════════════════════ */
const AuthCtx = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data);
    setLoading(false);
  }

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw new Error(error.message);
    if (data.user) await supabase.from("profiles").upsert({ id: data.user.id, name, email });
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  }

  async function signOut() { await supabase.auth.signOut(); }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw new Error(error.message);
  }

  return <AuthCtx.Provider value={{ user, profile, loading, signUp, signIn, signOut, resetPassword }}>{children}</AuthCtx.Provider>;
}

function useAuth() { return useContext(AuthCtx); }

/* ══════════════════════════════
   SHARED UI
══════════════════════════════ */
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, []);
  return <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", background:"#111827", border:"1px solid #1F2937", color:"#F9FAFB", padding:"12px 24px", borderRadius:14, fontSize:13, boxShadow:"0 20px 60px rgba(0,0,0,.6)", zIndex:9999, whiteSpace:"nowrap", animation:"toastIn .3s cubic-bezier(.34,1.56,.64,1) both" }}>{msg}</div>;
}

function Spin({ dark=false }) {
  return <div style={{ width:18, height:18, border:`2px solid ${dark?"rgba(3,7,18,.25)":"rgba(249,250,251,.2)"}`, borderTopColor:dark?"#030712":"#F9FAFB", borderRadius:"50%", animation:"spin .6s linear infinite" }} />;
}

function PwInput({ value, onChange, placeholder="Password", autoComplete="current-password" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input className="input" type={show?"text":"password"} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} style={{paddingRight:44}} />
      <span className="eye" onClick={()=>setShow(s=>!s)}>{show?"🙈":"👁"}</span>
    </div>
  );
}

function StrBar({ pw }) {
  const s = !pw ? 0 : [/.{8,}/,/[A-Z]/,/[0-9]/,/[^A-Za-z0-9]/].filter(r=>r.test(pw)).length;
  const c = ["","#F87171","#FBBF24","#60A5FA","#34D399"];
  const l = ["","Weak","Fair","Good","Strong"];
  if (!pw) return null;
  return <div style={{marginTop:6}}><div style={{display:"flex",gap:4,marginBottom:4}}>{[1,2,3,4].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=s?c[s]:"var(--border2)",transition:"background .3s"}}/>)}</div><div style={{fontSize:11,color:c[s],fontFamily:"var(--mono)"}}>{l[s]}</div></div>;
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return <div style={{fontSize:12,color:"var(--red)",background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.15)",borderRadius:8,padding:"10px 14px"}}>⚠ {msg}</div>;
}

/* ══════════════════════════════
   AUTH SHELL
══════════════════════════════ */
function AuthShell({ children }) {
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-20%",left:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(52,211,153,.06) 0%,transparent 70%)",animation:"bgFloat 8s ease-in-out infinite",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-20%",right:"-10%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,.05) 0%,transparent 70%)",animation:"bgFloat 10s ease-in-out infinite reverse",pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:440}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:36}}>
          <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#34D399,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 0 30px rgba(52,211,153,.3)"}}>↓</div>
          <span style={{fontFamily:"var(--serif)",fontSize:26,fontWeight:800,letterSpacing:"-0.04em"}}>PriceDrop</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function LoginScreen({ onSwitch }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  async function handle(e) { e.preventDefault(); setErr(""); setLoading(true); try { await signIn(email,pw); } catch(e){setErr(e.message);} finally{setLoading(false);} }
  return (
    <AuthShell>
      <div className="auth-card" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:"36px 40px"}}>
        <h2 style={{fontFamily:"var(--serif)",fontSize:24,fontWeight:800,letterSpacing:"-0.03em",marginBottom:6}}>Welcome back</h2>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:28}}>Sign in to see your savings</p>
        <form onSubmit={handle} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{display:"block",fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Email</label>
            <input className={`input${err?" err":""}`} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} autoFocus autoComplete="email" required/>
          </div>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <label style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Password</label>
              <button type="button" style={{background:"none",border:"none",fontSize:11,color:"var(--green)",cursor:"pointer"}} onClick={()=>onSwitch("reset")}>Forgot password?</button>
            </div>
            <PwInput value={pw} onChange={e=>setPw(e.target.value)}/>
          </div>
          <ErrBox msg={err}/>
          <button type="submit" className="btn btn-green" style={{width:"100%",marginTop:4}} disabled={loading||!email||!pw}>{loading?<Spin dark/>:"Sign In →"}</button>
        </form>
        <p style={{textAlign:"center",marginTop:24,fontSize:13,color:"var(--muted)"}}>No account? <button style={{background:"none",border:"none",color:"var(--green)",cursor:"pointer",fontWeight:700,fontSize:13}} onClick={()=>onSwitch("signup")}>Sign up free</button></p>
      </div>
    </AuthShell>
  );
}

function SignupScreen({ onSwitch }) {
  const { signUp } = useAuth();
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [agree,setAgree]=useState(false);
  const [loading,setLoading]=useState(false); const [err,setErr]=useState(""); const [done,setDone]=useState(false);
  async function handle(e) { e.preventDefault(); if(pw.length<6){setErr("Password must be at least 6 characters.");return;} setErr(""); setLoading(true); try{await signUp(email,pw,name);setDone(true);}catch(e){setErr(e.message);}finally{setLoading(false);} }
  if (done) return (
    <AuthShell>
      <div className="auth-card" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:"40px",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>📬</div>
        <h2 style={{fontFamily:"var(--serif)",fontSize:22,fontWeight:800,marginBottom:8}}>Check your email</h2>
        <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.7,marginBottom:28}}>We sent a confirmation to <strong style={{color:"var(--text)"}}>{email}</strong>. Click the link to activate your account.</p>
        <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>onSwitch("login")}>← Back to sign in</button>
      </div>
    </AuthShell>
  );
  return (
    <AuthShell>
      <div className="auth-card" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:"36px 40px"}}>
        <h2 style={{fontFamily:"var(--serif)",fontSize:24,fontWeight:800,letterSpacing:"-0.03em",marginBottom:6}}>Start saving money</h2>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:28}}>Free to join. We only earn when you do.</p>
        <form onSubmit={handle} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={{display:"block",fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Full Name</label><input className="input" type="text" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} autoFocus required/></div>
          <div><label style={{display:"block",fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Email</label><input className="input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></div>
          <div><label style={{display:"block",fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Password</label><PwInput value={pw} onChange={e=>setPw(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password"/><StrBar pw={pw}/></div>
          <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}}><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} style={{marginTop:3,accentColor:"var(--green)",width:14,height:14,flexShrink:0}}/><span style={{fontSize:12,color:"var(--muted)",lineHeight:1.6}}>I agree to the Terms and understand PriceDrop keeps 25% of refunds recovered.</span></label>
          <ErrBox msg={err}/>
          <button type="submit" className="btn btn-green" style={{width:"100%",marginTop:4}} disabled={loading||!name||!email||!pw||!agree}>{loading?<Spin dark/>:"Create Free Account →"}</button>
        </form>
        <p style={{textAlign:"center",marginTop:24,fontSize:13,color:"var(--muted)"}}>Already have an account? <button style={{background:"none",border:"none",color:"var(--green)",cursor:"pointer",fontWeight:700,fontSize:13}} onClick={()=>onSwitch("login")}>Sign in</button></p>
      </div>
    </AuthShell>
  );
}

function ResetScreen({ onSwitch }) {
  const { resetPassword } = useAuth();
  const [email,setEmail]=useState(""); const [loading,setLoading]=useState(false); const [sent,setSent]=useState(false); const [err,setErr]=useState("");
  async function handle(e) { e.preventDefault(); setErr(""); setLoading(true); try{await resetPassword(email);setSent(true);}catch(e){setErr(e.message);}finally{setLoading(false);} }
  return (
    <AuthShell>
      <div className="auth-card" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:"36px 40px"}}>
        {sent ? (
          <div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>📬</div><h2 style={{fontFamily:"var(--serif)",fontSize:22,fontWeight:800,marginBottom:8}}>Check your inbox</h2><p style={{color:"var(--muted)",fontSize:13,lineHeight:1.7,marginBottom:28}}>Reset link sent to <strong style={{color:"var(--text)"}}>{email}</strong></p><button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>onSwitch("login")}>← Back to sign in</button></div>
        ) : (
          <>
            <h2 style={{fontFamily:"var(--serif)",fontSize:24,fontWeight:800,letterSpacing:"-0.03em",marginBottom:6}}>Reset password</h2>
            <p style={{color:"var(--muted)",fontSize:13,marginBottom:28}}>We'll email you a reset link.</p>
            <form onSubmit={handle} style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><label style={{display:"block",fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Email</label><input className="input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} autoFocus required/></div>
              <ErrBox msg={err}/>
              <button type="submit" className="btn btn-green" style={{width:"100%"}} disabled={loading||!email}>{loading?<Spin dark/>:"Send Reset Link"}</button>
            </form>
            <p style={{textAlign:"center",marginTop:20}}><button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer"}} onClick={()=>onSwitch("login")}>← Back to sign in</button></p>
          </>
        )}
      </div>
    </AuthShell>
  );
}

/* ══════════════════════════════
   HELPERS
══════════════════════════════ */
const STATUS_MAP = {
  tracking:     {label:"Tracking",      color:"#60A5FA",bg:"rgba(96,165,250,0.1)"},
  refund_ready: {label:"Refund Ready!", color:"#34D399",bg:"rgba(52,211,153,0.12)"},
  claimed:      {label:"Claimed",       color:"#A78BFA",bg:"rgba(167,139,250,0.1)"},
  expired:      {label:"Expired",       color:"#F87171",bg:"rgba(248,113,113,0.08)"},
};
const STORES = ["Amazon","Best Buy","Walmart","Target","Apple","Nike","Costco","B&H Photo","Newegg"];
const fmt = n => Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const daysAgo = d => Math.floor((Date.now()-new Date(d))/86400000);
const daysLeft = item => Math.max(0, item.refund_window - daysAgo(item.bought_date));

function Sparkline({data,color="#34D399",width=100,height=36}) {
  if(!data||data.length<2) return null;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1;
  const pts=data.map((v,i)=>{const x=(i/(data.length-1))*width;const y=height-((v-min)/range)*(height-6)-3;return `${x},${y}`;}).join(" ");
  const last=pts.split(" ").slice(-1)[0].split(",");
  return <svg width={width} height={height} style={{overflow:"visible"}}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/><circle cx={last[0]} cy={last[1]} r="3" fill={color}/></svg>;
}

function EarningsChart({data}) {
  const max=Math.max(...data.map(d=>d.v),1);
  return <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>{data.map((d,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}><div style={{width:"100%",height:`${(d.v/max)*64}px`,minHeight:3,background:i===data.length-1?"#34D399":"rgba(52,211,153,.2)",borderRadius:"4px 4px 0 0",transition:"height 1s cubic-bezier(.4,0,.2,1)"}}/><span style={{fontSize:9,color:"var(--muted)",fontFamily:"var(--mono)"}}>{d.l}</span></div>)}</div>;
}

function Counter({to,prefix="",suffix="",decimals=2}) {
  const [val,setVal]=useState(0);
  useEffect(()=>{const s=performance.now();function tick(n){const p=Math.min((n-s)/1200,1);setVal(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);},[to]);
  return <>{prefix}{val.toFixed(decimals)}{suffix}</>;
}

/* ══════════════════════════════
   MAIN APP
══════════════════════════════ */
function App() {
  const {user,profile,signOut} = useAuth();
  const [page,setPage] = useState("dashboard");
  const [items,setItems] = useState([]);
  const [loadingItems,setLoadingItems] = useState(true);
  const [detailItem,setDetailItem] = useState(null);
  const [animKey,setAnimKey] = useState(0);
  const [toast,setToast] = useState(null);
  const [addModal,setAddModal] = useState(false);
  const [newItem,setNewItem] = useState({name:"",store:"Amazon",bought_price:"",refund_window:"30"});
  const [saving,setSaving] = useState(false);

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "there";

  useEffect(()=>{
    loadItems();
    // Handle PayPal success redirect
    const params = new URLSearchParams(window.location.search);
    if(params.get("success")==="true") {
      const itemId = params.get("itemId");
      if(itemId) {
        supabase.from("items").update({status:"claimed"}).eq("id",itemId).then(()=>{
          loadItems();
          window.history.replaceState({},"",window.location.pathname);
          setTimeout(()=>showToast("💸 Payment confirmed! Refund claimed successfully!"),800);
        });
      }
    }
    if(params.get("cancelled")==="true") {
      window.history.replaceState({},"",window.location.pathname);
      setTimeout(()=>showToast("↩ Payment cancelled"),500);
    }
  },[user]);

  async function loadItems() {
    if(!user) return;
    setLoadingItems(true);
    const {data,error} = await supabase.from("items").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
    if(!error&&data) setItems(data);
    setLoadingItems(false);
  }

  function go(p,extra=null){setAnimKey(k=>k+1);setPage(p);if(extra)setDetailItem(extra);}
  function showToast(m){setToast(m);}

  const readyItems = items.filter(i=>i.status==="refund_ready");
  const claimedItems = items.filter(i=>i.status==="claimed");
  const totalEarned = claimedItems.reduce((s,i)=>s+(i.my_earning||0),0);
  const pendingEarned = readyItems.reduce((s,i)=>s+(i.my_earning||0),0);
  const totalSaved = claimedItems.reduce((s,i)=>s+(i.refund_amount||0),0);

  async function claimRefund(id) {
    const item=items.find(i=>i.id===id);
    showToast("⏳ Opening PayPal…");
    try {
      const res = await fetch("/api/create-checkout", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({itemId:item.id,itemName:item.name,refundAmount:item.refund_amount,myEarning:item.my_earning,userId:user.id})
      });
      const data = await res.json();
      if(data.url) { window.location.href = data.url; return; }
      showToast("❌ Payment error: "+(data.error||"Unknown error"));
    } catch(e) { showToast("❌ "+e.message); }
  }

  async function addItemFn() {
    setSaving(true);
    const price=parseFloat(newItem.bought_price);
    const {data,error}=await supabase.from("items").insert({
      user_id:user.id, name:newItem.name, store:newItem.store, image:"📦",
      bought_price:price, current_price:price, lowest_price:price,
      bought_date:new Date().toISOString().split("T")[0],
      refund_window:parseInt(newItem.refund_window),
      status:"tracking", price_history:[price], refund_amount:0, my_earning:0,
    }).select().single();
    setSaving(false);
    if(error){showToast("❌ Error: "+error.message);return;}
    setItems(prev=>[data,...prev]);
    setAddModal(false);
    setNewItem({name:"",store:"Amazon",bought_price:"",refund_window:"30"});
    showToast("✓ Now tracking "+newItem.name.slice(0,30)+"…");
  }

  const chartData=[{l:"Oct",v:8.5},{l:"Nov",v:14},{l:"Dec",v:22.5},{l:"Jan",v:18},{l:"Feb",v:31},{l:"Mar",v:totalEarned+pendingEarned}];

  const Sidebar=()=>(
    <div style={{width:230,flexShrink:0,background:"var(--surface)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",padding:"28px 0"}}>
      <div style={{padding:"0 24px 32px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#34D399,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 20px rgba(52,211,153,.3)"}}>↓</div>
        <div><div style={{fontFamily:"var(--serif)",fontSize:18,fontWeight:800,letterSpacing:"-0.03em"}}>PriceDrop</div><div style={{fontSize:10,color:"var(--green)",fontFamily:"var(--mono)",letterSpacing:"0.06em"}}>LIVE</div></div>
      </div>
      {readyItems.length>0&&<div onClick={()=>go("refunds")} style={{margin:"0 12px 20px",background:"rgba(52,211,153,.08)",border:"1px solid rgba(52,211,153,.25)",borderRadius:10,padding:"10px 14px",cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><div className="pulse-dot"/><span style={{fontFamily:"var(--serif)",fontSize:12,fontWeight:700,color:"var(--green)"}}>{readyItems.length} Refund{readyItems.length>1?"s":""} Ready!</span></div><div style={{fontSize:11,color:"var(--muted2)",fontFamily:"var(--mono)"}}>${fmt(pendingEarned)} waiting</div></div>}
      <nav style={{flex:1,padding:"0 10px",display:"flex",flexDirection:"column",gap:2}}>
        {[{id:"dashboard",icon:"▦",label:"Dashboard"},{id:"tracking",icon:"◎",label:"Tracking"},{id:"refunds",icon:"↩",label:"Refunds",badge:readyItems.length},{id:"earnings",icon:"$",label:"My Earnings"},{id:"how",icon:"?",label:"How It Works"}].map(n=>{const active=page===n.id;return(
          <button key={n.id} className="nav-btn" onClick={()=>go(n.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",color:active?"var(--text)":"var(--muted)",background:active?"var(--card)":"transparent",border:active?"1px solid var(--border)":"1px solid transparent"}}>
            <span style={{fontFamily:"var(--mono)",fontSize:14,color:active?"var(--green)":"inherit",width:18,textAlign:"center"}}>{n.icon}</span>{n.label}
            {n.badge>0&&<span style={{marginLeft:"auto",background:"var(--green)",color:"#030712",fontSize:10,fontWeight:700,borderRadius:20,padding:"1px 7px",fontFamily:"var(--mono)"}}>{n.badge}</span>}
          </button>
        );})}
      </nav>
      <div style={{padding:"12px 12px 0",borderTop:"1px solid var(--border)"}}>
        <button className="btn btn-green" style={{width:"100%",marginBottom:10}} onClick={()=>setAddModal(true)}>+ Add Purchase</button>
        <button className="nav-btn" style={{width:"100%",display:"flex",alignItems:"center",gap:10,color:"var(--muted)"}} onClick={()=>go("profile")}>
          <div style={{width:26,height:26,borderRadius:"50%",background:"rgba(52,211,153,.15)",border:"1px solid rgba(52,211,153,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"var(--green)",fontWeight:700}}>{displayName[0].toUpperCase()}</div>
          <span style={{fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName}</span>
        </button>
      </div>
    </div>
  );

  const Dashboard=()=>(
    <div className="page" key={`d${animKey}`} style={{padding:"40px 44px",overflowY:"auto",flex:1}}>
      <div style={{marginBottom:36}}><h1 style={{fontFamily:"var(--serif)",fontSize:32,fontWeight:800,letterSpacing:"-0.04em",marginBottom:6}}>Hey {displayName.split(" ")[0]} 👋 <span style={{color:"var(--green)"}}>Your money's coming back.</span></h1><p style={{color:"var(--muted)",fontSize:14}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
        {[{label:"Total Saved",value:`$${fmt(totalSaved)}`,sub:`${claimedItems.length} refunds claimed`,color:"var(--green)"},{label:"You Earned",value:`$${fmt(totalEarned+pendingEarned)}`,sub:"25% of all refunds",color:"var(--purple)"},{label:"Tracking",value:items.filter(i=>["tracking","refund_ready"].includes(i.status)).length,sub:`${readyItems.length} ready to claim`,color:"var(--blue)"}].map((s,i)=>(
          <div key={i} className="card" style={{padding:"24px 26px"}}><div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>{s.label}</div><div style={{fontFamily:"var(--serif)",fontSize:36,fontWeight:800,letterSpacing:"-0.04em",color:s.color,lineHeight:1}}>{s.value}</div><div style={{fontSize:12,color:"var(--muted)",marginTop:8}}>{s.sub}</div></div>
        ))}
      </div>
      {readyItems.length>0&&<div className="glow" style={{background:"var(--green-dim)",border:"1px solid rgba(52,211,153,.3)",borderRadius:16,padding:"20px 28px",marginBottom:24,display:"flex",alignItems:"center",gap:20,cursor:"pointer"}} onClick={()=>go("refunds")}><div style={{fontSize:32}}>💰</div><div style={{flex:1}}><div style={{fontFamily:"var(--serif)",fontSize:16,fontWeight:700,color:"var(--green)",marginBottom:3}}>{readyItems.length} price drop{readyItems.length>1?"s":""} detected — ${fmt(readyItems.reduce((s,i)=>s+(i.refund_amount||0),0))} ready</div><div style={{fontSize:13,color:"var(--muted2)"}}>You'll earn ${fmt(pendingEarned)} after claiming →</div></div></div>}
      {loadingItems?<div style={{textAlign:"center",padding:40,color:"var(--muted)"}}>Loading…</div>:items.length===0?(
        <div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:48,marginBottom:16}}>📦</div><div style={{fontFamily:"var(--serif)",fontSize:18,fontWeight:700,marginBottom:8}}>Nothing tracked yet</div><p style={{color:"var(--muted)",fontSize:14,marginBottom:24}}>Add your first purchase and we'll watch the price for you.</p><button className="btn btn-green" onClick={()=>setAddModal(true)}>+ Add Your First Purchase</button></div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:20}}>
          <div className="card" style={{overflow:"hidden"}}>
            <div style={{padding:"16px 22px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontFamily:"var(--serif)",fontSize:14,fontWeight:700}}>Your Items</span><button style={{background:"none",border:"none",fontSize:12,color:"var(--muted)",cursor:"pointer"}} onClick={()=>go("tracking")}>View all →</button></div>
            {items.slice(0,5).map((item,i)=>{const s=STATUS_MAP[item.status]||STATUS_MAP.tracking;return(
              <div key={item.id} style={{padding:"14px 22px",display:"flex",alignItems:"center",gap:14,borderBottom:i<4?"1px solid var(--border)":"none",cursor:"pointer"}} onClick={()=>go("detail",item)} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.02)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{fontSize:22,flexShrink:0}}>{item.image||"📦"}</div>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:1}}>{item.store}</div></div>
                <span style={{fontSize:10,fontWeight:600,color:s.color,background:s.bg,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap",fontFamily:"var(--mono)"}}>{s.label}</span>
              </div>
            );})}
          </div>
          <div className="card" style={{padding:"22px 24px"}}><div style={{fontFamily:"var(--serif)",fontSize:14,fontWeight:700,marginBottom:4}}>Your Earnings</div><div style={{fontFamily:"var(--serif)",fontSize:28,fontWeight:800,color:"var(--green)",letterSpacing:"-0.03em",marginBottom:18}}>${fmt(totalEarned+pendingEarned)}</div><EarningsChart data={chartData}/><div style={{fontSize:11,color:"var(--muted)",marginTop:10,fontFamily:"var(--mono)"}}>Last 6 months · 25% cut</div></div>
        </div>
      )}
    </div>
  );

  const Tracking=()=>(
    <div className="page" key={`t${animKey}`} style={{padding:"40px 44px",overflowY:"auto",flex:1}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32}}><div><h1 style={{fontFamily:"var(--serif)",fontSize:28,fontWeight:800,letterSpacing:"-0.03em",marginBottom:4}}>Tracking</h1><p style={{color:"var(--muted)",fontSize:13}}>{items.length} purchases · {readyItems.length} drops found</p></div><button className="btn btn-green btn-sm" onClick={()=>setAddModal(true)}>+ Add</button></div>
      {loadingItems?<div style={{textAlign:"center",padding:40,color:"var(--muted)"}}>Loading…</div>:items.length===0?<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:48,marginBottom:16}}>◎</div><p style={{color:"var(--muted)",fontSize:14,marginBottom:20}}>Nothing tracked yet.</p><button className="btn btn-green" onClick={()=>setAddModal(true)}>+ Add Purchase</button></div>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {items.map(item=>{const s=STATUS_MAP[item.status]||STATUS_MAP.tracking;const dropped=(item.bought_price||0)-(item.current_price||0);return(
            <div key={item.id} className="card" style={{padding:"18px 22px",cursor:"pointer",display:"flex",alignItems:"center",gap:18}} onClick={()=>go("detail",item)}>
              <div style={{width:44,height:44,borderRadius:12,background:"var(--surface)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{item.image||"📦"}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontFamily:"var(--serif)",fontSize:15,fontWeight:700,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div><div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)"}}>{item.store} · {daysLeft(item)}d left</div></div>
              <Sparkline data={item.price_history||[item.current_price]} color={dropped>0?"#34D399":"#4B5563"} width={72} height={28}/>
              <div style={{textAlign:"right",minWidth:80}}><div style={{fontFamily:"var(--mono)",fontSize:17,fontWeight:500,color:dropped>0?"var(--green)":"var(--muted2)"}}>${fmt(item.current_price)}</div>{dropped>0&&<div style={{fontSize:11,color:"var(--green)",fontFamily:"var(--mono)"}}>↓${fmt(dropped)}</div>}</div>
              <span style={{fontSize:11,fontWeight:600,color:s.color,background:s.bg,padding:"5px 12px",borderRadius:20,whiteSpace:"nowrap",fontFamily:"var(--mono)"}}>{s.label}</span>
            </div>
          );})}
        </div>
      )}
    </div>
  );

  const Refunds=()=>(
    <div className="page" key={`r${animKey}`} style={{padding:"40px 44px",overflowY:"auto",flex:1}}>
      <h1 style={{fontFamily:"var(--serif)",fontSize:28,fontWeight:800,letterSpacing:"-0.03em",marginBottom:4}}>Refunds</h1>
      <p style={{color:"var(--muted)",fontSize:13,marginBottom:32}}>Claim before the store's refund window closes</p>
      {readyItems.length>0&&<><div style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--green)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>● Ready to claim</div><div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:32}}>{readyItems.map(item=><div key={item.id} className="card glow" style={{padding:"24px 28px",border:"1px solid rgba(52,211,153,.25)"}}><div style={{display:"flex",alignItems:"flex-start",gap:16}}><div style={{fontSize:28}}>{item.image||"📦"}</div><div style={{flex:1}}><div style={{fontFamily:"var(--serif)",fontSize:16,fontWeight:700,marginBottom:12}}>{item.name}</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>{[{l:"Paid",v:`$${fmt(item.bought_price)}`,c:"var(--muted2)"},{l:"Now",v:`$${fmt(item.current_price)}`,c:"var(--green)"},{l:"Refund",v:`$${fmt(item.refund_amount)}`,c:"var(--text)"},{l:"Your 25%",v:`$${fmt(item.my_earning)}`,c:"var(--purple)"}].map(s=><div key={s.l}><div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{s.l}</div><div style={{fontFamily:"var(--mono)",fontSize:20,fontWeight:500,color:s.c}}>{s.v}</div></div>)}</div><div style={{display:"flex",alignItems:"center",gap:14}}><button className="btn btn-green btn-sm" onClick={()=>claimRefund(item.id)}>Claim → {item.store}</button><span style={{fontSize:12,color:"var(--muted)"}}>⏱ {daysLeft(item)}d left</span></div></div></div></div>)}</div></>}
      {claimedItems.length>0&&<><div style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>✓ Claimed</div>{claimedItems.map(item=><div key={item.id} className="card" style={{padding:"16px 22px",display:"flex",alignItems:"center",gap:16,marginBottom:10,opacity:.75}}><span style={{fontSize:22}}>{item.image||"📦"}</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{item.name}</div><div style={{fontSize:11,color:"var(--muted)"}}>{item.store}</div></div><div style={{fontFamily:"var(--mono)",fontSize:16,color:"var(--purple)"}}>+${fmt(item.my_earning)}</div><span style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--green)",background:"rgba(52,211,153,.08)",padding:"4px 12px",borderRadius:20}}>Done ✓</span></div>)}</>}
      {readyItems.length===0&&claimedItems.length===0&&<div style={{textAlign:"center",padding:"80px 0",color:"var(--muted)"}}><div style={{fontSize:48,marginBottom:16}}>◎</div><div style={{fontFamily:"var(--mono)",fontSize:13}}>We're watching prices — check back soon</div></div>}
    </div>
  );

  const Earnings=()=>(
    <div className="page" key={`e${animKey}`} style={{padding:"40px 44px",overflowY:"auto",flex:1}}>
      <h1 style={{fontFamily:"var(--serif)",fontSize:28,fontWeight:800,letterSpacing:"-0.03em",marginBottom:4}}>My Earnings</h1>
      <p style={{color:"var(--muted)",fontSize:13,marginBottom:28}}>You keep 25% of every refund recovered</p>
      <div style={{background:"linear-gradient(135deg,rgba(52,211,153,.08),rgba(167,139,250,.08))",border:"1px solid rgba(52,211,153,.2)",borderRadius:20,padding:"32px 40px",marginBottom:24}}>
        <div style={{fontSize:12,color:"var(--green)",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Total Earned</div>
        <div style={{fontFamily:"var(--serif)",fontSize:56,fontWeight:800,letterSpacing:"-0.04em",color:"var(--green)",lineHeight:1,marginBottom:6}}>$<Counter to={totalEarned+pendingEarned} decimals={2}/></div>
        <div style={{fontSize:14,color:"var(--muted2)"}}>${fmt(totalEarned)} paid · <span style={{color:"var(--gold)"}}>${fmt(pendingEarned)} pending</span></div>
      </div>
      <div className="card" style={{padding:"22px 28px",marginBottom:18}}><div style={{fontFamily:"var(--serif)",fontSize:14,fontWeight:700,marginBottom:18}}>Monthly</div><EarningsChart data={chartData}/></div>
    </div>
  );

  const HowItWorks=()=>(
    <div className="page" key={`h${animKey}`} style={{padding:"40px 44px",overflowY:"auto",flex:1}}>
      <h1 style={{fontFamily:"var(--serif)",fontSize:28,fontWeight:800,letterSpacing:"-0.03em",marginBottom:4}}>How It Works</h1>
      <p style={{color:"var(--muted)",fontSize:13,marginBottom:32}}>Simple. Automatic. You make money.</p>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {[{n:"01",title:"Forward your receipt",desc:"After buying online, forward the order confirmation email to track@pricedrop.app",icon:"📧",color:"var(--blue)"},{n:"02",title:"We watch the price 24/7",desc:"PriceDrop checks the price every hour across 50+ major stores.",icon:"◎",color:"var(--purple)"},{n:"03",title:"Price drops → instant alert",desc:"When a drop is found within your refund window, you get notified immediately.",icon:"🔔",color:"var(--gold)"},{n:"04",title:"Claim in one click",desc:"Hit Claim and we file the refund request. Most stores respond in 24–48 hours.",icon:"↩",color:"var(--green)"},{n:"05",title:"75% yours, 25% ours",desc:"The refund hits your account. PriceDrop takes 25% via PayPal. Zero upfront cost.",icon:"$",color:"var(--green)"}].map((step,i)=>(
          <div key={i} className="card" style={{padding:"22px 26px",display:"flex",gap:18,alignItems:"flex-start"}}>
            <div style={{width:46,height:46,borderRadius:12,background:`${step.color}18`,border:`1px solid ${step.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{step.icon}</div>
            <div><div style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",marginBottom:3,letterSpacing:"0.08em"}}>STEP {step.n}</div><div style={{fontFamily:"var(--serif)",fontSize:16,fontWeight:700,marginBottom:5,color:step.color}}>{step.title}</div><div style={{fontSize:13,color:"var(--muted2)",lineHeight:1.7}}>{step.desc}</div></div>
          </div>
        ))}
      </div>
    </div>
  );

  const Detail=()=>{
    const item=detailItem;if(!item)return null;
    const s=STATUS_MAP[item.status]||STATUS_MAP.tracking;
    const dropped=(item.bought_price||0)-(item.current_price||0);
    const daysUsed=daysAgo(item.bought_date);
    const pct=Math.min((daysUsed/(item.refund_window||30))*100,100);
    return(
      <div className="page" key={`det${animKey}`} style={{padding:"40px 44px",overflowY:"auto",flex:1}}>
        <button className="btn btn-ghost btn-sm" style={{marginBottom:24}} onClick={()=>go("tracking")}>← Back</button>
        <div style={{display:"flex",gap:18,alignItems:"flex-start",marginBottom:28}}>
          <div style={{width:60,height:60,borderRadius:16,background:"var(--card)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0}}>{item.image||"📦"}</div>
          <div style={{flex:1}}><div style={{fontFamily:"var(--serif)",fontSize:22,fontWeight:800,letterSpacing:"-0.03em",marginBottom:8}}>{item.name}</div><div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{item.store}</span><span style={{fontSize:11,fontWeight:600,color:s.color,background:s.bg,padding:"4px 12px",borderRadius:20,fontFamily:"var(--mono)"}}>{s.label}</span></div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
          {[{l:"You paid",v:`$${fmt(item.bought_price)}`,c:"var(--muted2)"},{l:"Current",v:`$${fmt(item.current_price)}`,c:dropped>0?"var(--green)":"var(--text)"},{l:"Lowest",v:`$${fmt(item.lowest_price)}`,c:"var(--blue)"}].map(s=><div key={s.l} className="card" style={{padding:"16px 18px"}}><div style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{s.l}</div><div style={{fontFamily:"var(--mono)",fontSize:22,fontWeight:500,color:s.c}}>{s.v}</div></div>)}
        </div>
        <div className="card" style={{padding:"20px 26px",marginBottom:18}}><div style={{fontFamily:"var(--serif)",fontSize:13,fontWeight:700,marginBottom:14}}>Price History</div><Sparkline data={item.price_history||[item.current_price]} color={dropped>0?"#34D399":"#4B5563"} width={480} height={72}/></div>
        <div className="card" style={{padding:"20px 26px",marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontFamily:"var(--serif)",fontSize:13,fontWeight:700}}>Refund Window</span><span style={{fontFamily:"var(--mono)",fontSize:12,color:daysLeft(item)<5?"var(--red)":"var(--muted2)"}}>{daysLeft(item)}d remaining</span></div>
          <div style={{height:6,background:"var(--surface)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:pct>80?"var(--red)":pct>60?"var(--gold)":"var(--green)",borderRadius:3,transition:"width 1s ease"}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)"}}>Bought {daysUsed}d ago</span><span style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)"}}>{item.refund_window}d window</span></div>
        </div>
        {item.status==="refund_ready"&&<div style={{background:"var(--green-dim)",border:"1px solid rgba(52,211,153,.3)",borderRadius:16,padding:"22px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontFamily:"var(--serif)",fontSize:15,fontWeight:700,color:"var(--green)",marginBottom:4}}>Refund: ${fmt(item.refund_amount)}</div><div style={{fontSize:13,color:"var(--muted2)"}}>You earn ${fmt(item.my_earning)}</div></div><button className="btn btn-green" onClick={()=>claimRefund(item.id)}>Claim Now →</button></div>}
      </div>
    );
  };

  const Profile=()=>(
    <div className="page" key={`p${animKey}`} style={{padding:"40px 44px",overflowY:"auto",flex:1}}>
      <h1 style={{fontFamily:"var(--serif)",fontSize:28,fontWeight:800,letterSpacing:"-0.03em",marginBottom:32}}>Account</h1>
      <div className="card" style={{padding:"28px 32px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:18,marginBottom:24}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(52,211,153,.15)",border:"2px solid rgba(52,211,153,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"var(--green)",fontWeight:700,fontFamily:"var(--serif)"}}>{displayName[0].toUpperCase()}</div>
          <div><div style={{fontFamily:"var(--serif)",fontSize:18,fontWeight:700}}>{displayName}</div><div style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--muted)"}}>{user?.email}</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[{l:"Items tracked",v:items.length},{l:"Refunds claimed",v:claimedItems.length},{l:"Total saved",v:`$${fmt(totalSaved)}`},{l:"Your earnings",v:`$${fmt(totalEarned+pendingEarned)}`}].map(s=>(
            <div key={s.l} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 18px"}}><div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{s.l}</div><div style={{fontFamily:"var(--mono)",fontSize:20,fontWeight:500,color:"var(--green)"}}>{s.v}</div></div>
          ))}
        </div>
      </div>
      <div className="card" style={{padding:"20px 28px",marginBottom:16}}>
        <div style={{fontFamily:"var(--serif)",fontSize:14,fontWeight:700,marginBottom:6}}>Database</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}><div className="pulse-dot"/><span style={{fontSize:12,color:"var(--green)"}}>Connected to Supabase · Live</span></div>
      </div>
      <button className="btn btn-danger" style={{width:"100%"}} onClick={signOut}>Sign Out</button>
    </div>
  );

  const AddModal=()=>(
    <div className="overlay" onClick={()=>setAddModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,backdropFilter:"blur(4px)"}}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{background:"var(--card)",border:"1px solid var(--border2)",borderRadius:20,padding:"36px 40px",width:480,boxShadow:"0 40px 100px rgba(0,0,0,.7)"}}>
        <div style={{fontFamily:"var(--serif)",fontSize:22,fontWeight:800,letterSpacing:"-0.03em",marginBottom:6}}>Track a Purchase</div>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:24,lineHeight:1.6}}>Add manually or forward your receipt to <span style={{fontFamily:"var(--mono)",color:"var(--green)",fontSize:12}}>track@pricedrop.app</span></p>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={{display:"block",fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Product Name</label><input className="input" placeholder="e.g. Sony WH-1000XM5 Headphones" value={newItem.name} onChange={e=>setNewItem(f=>({...f,name:e.target.value}))} autoFocus/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={{display:"block",fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Store</label><select className="input" value={newItem.store} onChange={e=>setNewItem(f=>({...f,store:e.target.value}))}>{STORES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label style={{display:"block",fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Price Paid</label><div style={{position:"relative"}}><span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--muted)",fontFamily:"var(--mono)"}}>$</span><input className="input" style={{paddingLeft:28}} type="number" step="0.01" placeholder="0.00" value={newItem.bought_price} onChange={e=>setNewItem(f=>({...f,bought_price:e.target.value}))}/></div></div>
          </div>
          <div><label style={{display:"block",fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Refund Window</label><select className="input" value={newItem.refund_window} onChange={e=>setNewItem(f=>({...f,refund_window:e.target.value}))}><option value="15">15 days</option><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option></select></div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:24}}>
          <button className="btn btn-green" style={{flex:1}} disabled={!newItem.name||!newItem.bought_price||saving} onClick={addItemFn}>{saving?<Spin dark/>:"Start Tracking"}</button>
          <button className="btn btn-ghost" onClick={()=>setAddModal(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );

  const pages={dashboard:<Dashboard/>,tracking:<Tracking/>,refunds:<Refunds/>,earnings:<Earnings/>,how:<HowItWorks/>,detail:<Detail/>,profile:<Profile/>};

  return(
    <><style>{CSS}</style>
    <div style={{display:"flex",height:"100vh",background:"var(--bg)",overflow:"hidden"}}>
      <Sidebar/><div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>{pages[page]}</div>
      {addModal&&<AddModal/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    </div></>
  );
}

/* ══════════════════════════════
   ROOT
══════════════════════════════ */
function AuthGate() {
  const {user,loading}=useAuth();
  const [screen,setScreen]=useState("login");
  if(loading) return(
    <div style={{minHeight:"100vh",background:"#030712",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#34D399,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,margin:"0 auto 16px",boxShadow:"0 0 20px rgba(52,211,153,.3)"}}>↓</div>
        <div style={{width:20,height:20,border:"2px solid rgba(52,211,153,.2)",borderTopColor:"#34D399",borderRadius:"50%",animation:"spin .6s linear infinite",margin:"0 auto"}}/>
      </div>
    </div>
  );
  if(user) return <App/>;
  return screen==="signup"?<SignupScreen onSwitch={setScreen}/>:screen==="reset"?<ResetScreen onSwitch={setScreen}/>:<LoginScreen onSwitch={setScreen}/>;
}

export default function Root() {
  return <AuthProvider><AuthGate/></AuthProvider>;
}

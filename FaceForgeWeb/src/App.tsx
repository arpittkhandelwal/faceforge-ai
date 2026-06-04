import { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import './index.css';

// ─── TYPES & STORAGE ───────────────────────────────────────
type User = { id: string; name: string; pin: string; role: string; createdAt: number };
type Log  = { id: string; userName: string; result: string; timestamp: number; confidence: number };
type VaultFile = { id: string; name: string; size: number; type: string; data: string; addedAt: number };

const getUsers = (): User[] => { try { return JSON.parse(localStorage.getItem('ff_users') || '[]'); } catch { return []; } };
const getLogs  = (): Log[]  => { try { return JSON.parse(localStorage.getItem('ff_logs')  || '[]'); } catch { return []; } };
const setUsers = (v: User[]) => localStorage.setItem('ff_users', JSON.stringify(v));
const setLogs  = (v: Log[])  => localStorage.setItem('ff_logs',  JSON.stringify(v));
const getVaultFiles = (uid: string): VaultFile[] => { try { return JSON.parse(localStorage.getItem(`ff_vault_${uid}`) || '[]'); } catch { return []; } };
const setVaultFiles = (uid: string, f: VaultFile[]) => localStorage.setItem(`ff_vault_${uid}`, JSON.stringify(f));

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05; window.speechSynthesis.speak(u);
};

// ─── AI MODEL ──────────────────────────────────────────────
function useFaceAI() {
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        if (!active) return;
        const lm = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "/face_landmarker.task", delegate: "GPU" },
          runningMode: "VIDEO", numFaces: 1, outputFaceBlendshapes: true
        });
        if (active) { setLandmarker(lm); setLoading(false); }
      } catch (e) { console.error(e); if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  return { landmarker, loading };
}

const fileIcon = (t: string) => t.startsWith('image/')?'🖼️':t==='application/pdf'?'📄':t.includes('word')?'📝':t.includes('sheet')||t.includes('excel')||t.includes('csv')?'📊':t.includes('zip')?'🗜️':t.startsWith('video/')?'🎥':t.startsWith('audio/')?'🎵':'📁';
const fmtSize  = (b: number) => b<1024?`${b}B`:b<1048576?`${(b/1024).toFixed(1)}KB`:`${(b/1048576).toFixed(1)}MB`;

// ─── PROGRESS RING ─────────────────────────────────────────
const ProgressRing = ({ progress, color }: { progress: number; color: string }) => {
  const r = 176, circ = 2 * Math.PI * r;
  return (
    <svg className="progress-ring" viewBox="0 0 360 360">
      <circle stroke={color} cx="180" cy="180" r={r} style={{ strokeDasharray: circ, strokeDashoffset: circ - (progress/100)*circ }} />
    </svg>
  );
};

// ─── SPLASH ────────────────────────────────────────────────
const SplashScreen = ({ onDone, loading }: any) => {
  useEffect(() => {
    if (!loading) { speak("FaceForge ready."); const t = setTimeout(onDone, 1200); return () => clearTimeout(t); }
  }, [loading]);

  return (
    <div className="fill flex-center" style={{ flexDirection:'column', background:'linear-gradient(180deg,#003580 0%,#0055cc 100%)' }}>
      <div style={{ position:'absolute', top:60, width:'100%', display:'flex', justifyContent:'center', gap:6 }}>
        {[...Array(7)].map((_,i) => <div key={i} style={{ width:3, height:3, borderRadius:2, background:'rgba(255,255,255,0.25)' }} />)}
      </div>
      <div className="animate-fade-in" style={{ background:'linear-gradient(135deg,#e8820c,#ffa94d)', borderRadius:50, padding:'6px 20px', fontSize:11, fontWeight:900, color:'#fff', letterSpacing:2, marginBottom:36, boxShadow:'0 6px 20px rgba(232,130,12,0.5)' }}>
        HACKATHON 7.0
      </div>
      <div className="animate-fade-in" style={{ width:160, height:160, borderRadius:30, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:14, boxShadow:'0 30px 80px rgba(0,0,0,0.35)', marginBottom:28 }}>
        <img src="/nhai_logo.png" alt="NHAI" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
      </div>
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <div style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.55)', letterSpacing:3, marginBottom:10 }}>NATIONAL HIGHWAYS AUTHORITY OF INDIA</div>
        <h1 style={{ fontSize:30, fontWeight:900, color:'#fff', letterSpacing:-0.5, lineHeight:1.2 }}>भारतीय राष्ट्रीय</h1>
        <h1 style={{ fontSize:30, fontWeight:900, color:'#fff', letterSpacing:-0.5, lineHeight:1.2 }}>राजमार्ग प्राधिकरण</h1>
      </div>
      <div>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.1)', padding:'10px 22px', borderRadius:50, border:'1px solid rgba(255,255,255,0.2)' }}>
            <div className="spinner" style={{ borderColor:'rgba(255,255,255,0.2)', borderTopColor:'#fff' }} />
            <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>Initializing Neural Engine...</span>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(0,200,81,0.2)', padding:'10px 22px', borderRadius:50, border:'1px solid rgba(0,200,81,0.4)' }}>
            <div style={{ width:7, height:7, borderRadius:4, background:'#00ff88', animation:'pulse-ring 1.5s ease-out infinite' }} />
            <span style={{ fontSize:12, fontWeight:800, color:'#00ff88' }}>System Online · Ready</span>
          </div>
        )}
      </div>
      <div style={{ position:'absolute', bottom:50, width:'65%', left:'17.5%' }}>
        <div style={{ height:3, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#e8820c,#ffa94d)', borderRadius:2, animation:'shimmer 1.5s ease-in-out infinite', backgroundSize:'200% 100%' }} />
        </div>
        <div style={{ textAlign:'center', color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:700, letterSpacing:1, marginTop:10 }}>NHAI HACKATHON 7.0 · FACEFORGE AI</div>
      </div>
    </div>
  );
};

// ─── SIDEBAR ───────────────────────────────────────────────
const Sidebar = ({ open, onClose, navigate }: any) => {
  const users = getUsers(), logs = getLogs();
  return (
    <>
      {open && <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(6px)', zIndex:200 }} />}
      <div style={{ position:'absolute', top:0, left:0, bottom:0, width:'82%', maxWidth:320, background:'#ffffff', zIndex:201, transform:open?'translateX(0)':'translateX(-100%)', transition:'transform 0.35s cubic-bezier(0.16,1,0.3,1)', display:'flex', flexDirection:'column', borderRadius:'0 32px 32px 0', boxShadow:'10px 0 60px rgba(0,0,0,0.15)' }}>
        <div style={{ background:'linear-gradient(135deg,#003580,#0066ff)', padding:'36px 24px 24px', borderRadius:'0 32px 0 0', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <img src="/nhai_logo.png" alt="NHAI" style={{ width:44, height:44, background:'#fff', borderRadius:14, padding:4, objectFit:'contain' }} />
              <div>
                <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.6)', letterSpacing:2 }}>NHAI · HACKATHON 7.0</div>
                <div style={{ fontSize:18, fontWeight:900, color:'#fff', letterSpacing:-0.5 }}>FaceForge AI</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:10, width:32, height:32, color:'#fff', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
          <div style={{ marginTop:20, display:'flex', gap:16 }}>
            {[{v:users.length,l:'Users'},{v:logs.length,l:'Auths'},{v:logs.filter(l=>l.result==='failure').length,l:'Blocked'}].map(s=>(
              <div key={s.l}>
                <div style={{ fontSize:20, fontWeight:900, color:'#fff' }}>{s.v}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.6)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:'16px 16px', flex:1, overflowY:'auto' }}>
          {[
            { icon:'🏠', label:'Dashboard', sub:'Overview & stats', tab:'home' },
            { icon:'📷', label:'Face Scan', sub:'Verify identity', tab:'scan' },
            { icon:'➕', label:'Enroll Identity', sub:'Register new user', action:'register' },
            { icon:'🔐', label:'Secure Vault', sub:'Encrypted file storage', tab:'vault' },
            { icon:'👤', label:'Profile', sub:'Your account', tab:'profile' },
            { icon:'📋', label:'Access Logs', sub:'Authentication history', action:'logs' },
          ].map(item => (
            <button key={item.label} onClick={() => { onClose(); if (item.tab) navigate(null, item.tab); else if (item.action) navigate(item.action); }} style={{ width:'100%', background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:14, padding:'13px 12px', borderRadius:16, marginBottom:4, transition:'background 0.2s', textAlign:'left' }}>
              <div style={{ width:42, height:42, borderRadius:14, background:'#f0f4f8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:'#1a202c' }}>{item.label}</div>
                <div style={{ fontSize:11, color:'#718096', fontWeight:500, marginTop:1 }}>{item.sub}</div>
              </div>
            </button>
          ))}
          <div style={{ height:1, background:'#e2e8f0', margin:'8px 0 12px' }} />
          <button onClick={() => { onClose(); navigate('admin'); }} style={{ width:'100%', background:'#fff5f5', border:'1px solid #fed7d7', cursor:'pointer', display:'flex', alignItems:'center', gap:14, padding:'13px 12px', borderRadius:16, textAlign:'left' }}>
            <div style={{ width:42, height:42, borderRadius:14, background:'#fed7d7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🔴</div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:'#e53e3e' }}>Admin Terminal</div>
              <div style={{ fontSize:11, color:'#e53e3e', opacity:0.8, fontWeight:500, marginTop:1 }}>ROOT_ACCESS · Export</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

// ─── TOP BAR ───────────────────────────────────────────────
const TopBar = ({ onMenuClick, title }: any) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 20px 10px', flexShrink:0, background:'#f5f7fa' }}>
    <button onClick={onMenuClick} style={{ width:44, height:44, borderRadius:16, background:'#fff', border:'1px solid #e2e8f0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.03)', flexShrink:0 }}>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {[0,1,2].map(i=><div key={i} style={{ width:18, height:2.5, borderRadius:2, background:'#1a202c' }} />)}
      </div>
    </button>
    <span style={{ fontSize:16, fontWeight:900, color:'#1a202c', letterSpacing:-0.3 }}>{title}</span>
    <div style={{ display:'flex', alignItems:'center', gap:6, background:'#e6fffa', border:'1px solid #b2f5ea', borderRadius:50, padding:'6px 12px' }}>
      <div style={{ width:6, height:6, borderRadius:3, background:'#38b2ac', animation:'pulse-ring 1.5s ease-out infinite' }} />
      <span style={{ fontSize:10, fontWeight:800, color:'#2c7a7b' }}>SECURE</span>
    </div>
  </div>
);

// ─── BOTTOM TAB BAR ────────────────────────────────────────
const BottomBar = ({ activeTab, setTab }: any) => {
  const tabs = [
    { id:'home',    icon:'🏠', label:'Home' },
    { id:'scan',    icon:'📷', label:'Scan' },
    { id:'vault',   icon:'🔐', label:'Vault' },
    { id:'profile', icon:'👤', label:'Profile' },
  ];
  return (
    <div style={{ flexShrink:0, padding:'8px 16px 24px', background:'#fff', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'space-around' }}>
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => setTab(tab.id)} style={{ flex:1, background:'transparent', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'6px 0', position:'relative' }}>
            {active && <div style={{ position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)', width:30, height:4, borderRadius:2, background:'linear-gradient(90deg,#003580,#0066ff)' }} />}
            <div style={{ width:48, height:40, borderRadius:16, background:active?'#ebf4ff':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, transition:'all 0.25s' }}>
              {tab.icon}
            </div>
            <span style={{ fontSize:10, fontWeight:active?800:600, color:active?'#0055cc':'#a0aec0', letterSpacing:0.2 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─── HOME TAB (CRAZY LIGHT THEME DASHBOARD) ────────────────
const HomeTab = ({ navigate }: any) => {
  const users = getUsers(), logs = getLogs();
  const spoofBlocks = logs.filter(l => l.result === 'failure').length;
  const totalVaultFiles = users.reduce((a,u)=>a+getVaultFiles(u.id).length,0);
  const successLogs = logs.filter(l => l.result.includes('success'));
  const avgConf = successLogs.length ? (successLogs.reduce((a,c)=>a+c.confidence,0)/successLogs.length*100).toFixed(0) : '0';
  
  
    <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', background: '#eef2f6', position:'relative' }}>
       {/* Inject crazy keyframes inline */}
       <style>{`
         @keyframes radar-scan { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
         @keyframes float-hud { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
         @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
         .crazy-grid { background-size: 20px 20px; background-image: linear-gradient(to right, rgba(0,85,204,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,85,204,0.03) 1px, transparent 1px); }
       `}</style>

       {/* Real-time Ticker */}
       <div style={{ background:'#fff', borderRadius:16, padding:'10px 12px', marginBottom:24, display:'flex', alignItems:'center', gap:16, boxShadow:'0 8px 24px rgba(0,0,0,0.04)', overflow:'hidden', position:'relative', border:'1px solid #e2e8f0' }}>
         <div style={{ background:'#0055cc', color:'#fff', padding:'6px 12px', borderRadius:10, fontSize:10, fontWeight:900, letterSpacing:1, zIndex:2, display:'flex', alignItems:'center', gap:6 }}>
           <div style={{ width:6, height:6, background:'#00ff88', borderRadius:3, animation:'pulse-ring 1s infinite' }}/> LIVE
         </div>
         <div style={{ flex:1, overflow:'hidden', whiteSpace:'nowrap', position:'relative', height:20 }}>
           <div style={{ position:'absolute', animation:'marquee 12s linear infinite', fontSize:11, fontWeight:800, color:'#0055cc', display:'flex', gap:40, fontFamily:'monospace' }}>
             <span>📡 NODE: HQ-BLR ACTIVE</span>
             <span>🛡️ ENCRYPTION: AES-256</span>
             <span>🧠 ENGINE: 478-POINT NEURAL MESH</span>
             <span>⚡ LATENCY: 12ms</span>
             <span>🌐 MODE: AIR-GAPPED</span>
           </div>
         </div>
       </div>

       {/* Big Hero HUD */}
       <div className="crazy-grid" style={{ background: '#ffffff', borderRadius: 36, padding: '36px 24px', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,85,204,0.08), inset 0 0 0 2px #fff', border:'1px solid rgba(0,85,204,0.1)', marginBottom: 24, animation: 'float-hud 6s ease-in-out infinite' }}>
          
          {/* Animated Background Orbs */}
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,85,204,0.12) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', filter:'blur(20px)' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,200,81,0.08) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', filter:'blur(20px)' }} />

          {/* Radar Scanner Background right side */}
          <div style={{ position:'absolute', top:-30, right:-30, width:180, height:180, borderRadius:'50%', border:'1px dashed rgba(0,85,204,0.2)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0.6 }}>
             <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'conic-gradient(from 0deg, transparent 70%, rgba(0,85,204,0.1) 100%)', animation:'radar-scan 4s linear infinite' }} />
             <div style={{ position:'absolute', width:140, height:140, borderRadius:'50%', border:'1px solid rgba(0,85,204,0.1)' }} />
             <div style={{ position:'absolute', width:100, height:100, borderRadius:'50%', border:'1px solid rgba(0,85,204,0.15)' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div>
                <div style={{ display:'inline-block', background:'rgba(0,85,204,0.08)', padding:'6px 14px', borderRadius:50, fontSize: 10, fontWeight: 900, color: '#0055cc', letterSpacing: 2, marginBottom: 14, border:'1px solid rgba(0,85,204,0.15)' }}>NHAI · FACEFORGE</div>
                <h2 style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', letterSpacing: -1.5, lineHeight: 1.05, marginBottom:20 }}>Central<br/>Intelligence</h2>
                
                {/* Micro metrics inline */}
                <div style={{ display:'flex', gap:20, marginBottom:28 }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:800, color:'#64748b' }}>AVG MATCH</div>
                    <div style={{ fontSize:20, fontWeight:900, color:'#00c851' }}>{avgConf}%</div>
                  </div>
                  <div style={{ width:1, background:'#e2e8f0' }} />
                  <div>
                    <div style={{ fontSize:10, fontWeight:800, color:'#64748b' }}>FILES SECURED</div>
                    <div style={{ fontSize:20, fontWeight:900, color:'#0055cc' }}>{totalVaultFiles}</div>
                  </div>
                </div>
              </div>
              
              {/* Floating Logo HUD */}
              <div style={{ position:'relative', width:68, height:68, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ position:'absolute', inset:-10, borderRadius:'50%', border:'2.5px solid #0055cc', borderLeftColor:'transparent', borderRightColor:'transparent', animation:'radar-scan 6s linear infinite' }} />
                <div style={{ position:'absolute', inset:-18, borderRadius:'50%', border:'1.5px dashed #00c851', animation:'radar-scan 10s linear infinite reverse' }} />
                <img src="/nhai_logo.png" alt="NHAI" style={{ width: '100%', height: '100%', background: '#fff', borderRadius: '50%', padding: 10, boxShadow: '0 12px 32px rgba(0,85,204,0.25)', position:'relative', zIndex:2 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14 }}>
              <button onClick={() => navigate('register')} style={{ flex: 1, background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0', borderRadius: 24, padding: '20px 12px', fontWeight: 900, fontSize: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor:'pointer', transition:'all 0.2s' }}>
                <div style={{ width:44, height:44, borderRadius:14, background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 22 }}>➕</div> Enroll Identity
              </button>
              <button onClick={() => navigate('select-identity')} style={{ flex: 1, background: 'linear-gradient(135deg, #0055cc, #003580)', color: '#fff', border: 'none', borderRadius: 24, padding: '20px 12px', fontWeight: 900, fontSize: 14, boxShadow: '0 16px 32px rgba(0,85,204,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor:'pointer', transition:'all 0.2s' }}>
                <div style={{ width:44, height:44, borderRadius:14, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 22 }}>📷</div> Verify User
              </button>
            </div>
          </div>
       </div>

       {/* Metrics Grid with Data Visualization */}
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <div style={{ background: '#fff', borderRadius: 28, padding: '24px', boxShadow: '0 12px 24px rgba(0,0,0,0.03)', position:'relative', overflow:'hidden', border:'1px solid #e2e8f0' }}>
             <div style={{ position:'absolute', bottom:0, left:0, right:0, height:48, background:'linear-gradient(to right, #0055cc, #00a8ff)', opacity:0.1, clipPath:'polygon(0 100%, 0 80%, 20% 60%, 40% 90%, 60% 40%, 80% 70%, 100% 20%, 100% 100%)' }} />
             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
               <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b', letterSpacing: 1 }}>DATABASE</div>
               <div style={{ width:8, height:8, borderRadius:4, background:'#0055cc', boxShadow:'0 0 8px #0055cc' }} />
             </div>
             <div style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', letterSpacing: -2, lineHeight:1 }}>{users.length}</div>
             <div style={{ fontSize: 12, fontWeight: 800, color: '#0055cc', marginTop: 6 }}>Registered Profiles</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 28, padding: '24px', boxShadow: '0 12px 24px rgba(0,0,0,0.03)', position:'relative', overflow:'hidden', border:'1px solid #e2e8f0' }}>
             <div style={{ position:'absolute', bottom:0, left:0, right:0, height:48, background:spoofBlocks>0?'linear-gradient(to right, #e53e3e, #fc8181)':'linear-gradient(to right, #00c851, #38b2ac)', opacity:0.1, clipPath:'polygon(0 100%, 0 50%, 25% 80%, 50% 30%, 75% 90%, 100% 40%, 100% 100%)' }} />
             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
               <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b', letterSpacing: 1 }}>THREATS</div>
               <div style={{ width:8, height:8, borderRadius:4, background:spoofBlocks>0?'#e53e3e':'#00c851', boxShadow:`0 0 8px ${spoofBlocks>0?'#e53e3e':'#00c851'}` }} />
             </div>
             <div style={{ fontSize: 48, fontWeight: 900, color: spoofBlocks > 0 ? '#e53e3e' : '#00c851', letterSpacing: -2, lineHeight:1 }}>{spoofBlocks > 0 ? spoofBlocks : '0'}</div>
             <div style={{ fontSize: 12, fontWeight: 800, color: spoofBlocks > 0 ? '#e53e3e' : '#00c851', marginTop: 6 }}>Spoofs Blocked</div>
          </div>
       </div>

       {/* Recent Activity Stream */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: -0.5 }}>Network Stream</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop:2 }}>Real-time authentication logs</div>
          </div>
          <button onClick={() => navigate('logs')} style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0055cc', padding:'8px 14px', borderRadius:10, fontSize: 11, fontWeight: 900, cursor: 'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.02)' }}>ALL LOGS</button>
       </div>
       <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {logs.length === 0 ? (
             <div style={{ background: '#fff', borderRadius: 24, padding: '40px 20px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.02)', border:'2px dashed #cbd5e1' }}>
                <div style={{ fontSize: 36, marginBottom:16 }}>📡</div>
                <div style={{ color: '#64748b', fontSize: 15, fontWeight: 800 }}>Awaiting telemetry...</div>
             </div>
          ) : logs.slice(0, 4).map(l => {
             const ok = l.result.includes('success');
             return (
               <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 24, padding: '16px 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.03)', border: `1px solid ${ok ? 'rgba(0,200,81,0.2)' : 'rgba(229,62,62,0.2)'}`, position:'relative', overflow:'hidden' }}>
                 {/* Live scan line effect */}
                 <div style={{ position:'absolute', left:0, top:0, bottom:0, width:6, background: ok?'#00c851':'#e53e3e', boxShadow:`0 0 12px ${ok?'#00c851':'#e53e3e'}` }} />
                 
                 <div style={{ width: 48, height: 48, borderRadius: 14, background: ok ? '#e6fffa' : '#fff5f5', color: ok ? '#00c851' : '#e53e3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900 }}>
                   {ok ? '✓' : '✕'}
                 </div>
                 <div style={{ flex: 1 }}>
                   <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 6 }}>
                     <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{l.userName}</div>
                     <div style={{ fontSize: 10, fontWeight: 900, color: ok ? '#00c851' : '#e53e3e', background: ok ? '#e6fffa' : '#fff5f5', padding: '6px 10px', borderRadius: 8 }}>
                       {ok ? 'GRANTED' : 'DENIED'}
                     </div>
                   </div>
                   <div style={{ display:'flex', gap:16, fontSize: 12, color: '#64748b', fontWeight: 700, fontFamily:'monospace' }}>
                     <span>{new Date(l.timestamp).toLocaleTimeString()}</span>
                     <span>CONF: {Math.round(l.confidence*100)}%</span>
                   </div>
                 </div>
               </div>
             )
          })}
       </div>
    </div>
  );
};

// ─── SCAN TAB ──────────────────────────────────────────────
const ScanTab = ({ navigate }: any) => {
  const users = getUsers();
  return (
    <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', background:'#f5f7fa' }}>
      <div style={{ textAlign:'center', marginBottom:32, paddingTop:20 }}>
        <div style={{ width:88, height:88, borderRadius:30, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'0 auto 16px', boxShadow:'0 16px 32px rgba(0,0,0,0.05)' }}>📷</div>
        <h2 style={{ fontSize:26, fontWeight:900, letterSpacing:-0.8, color:'#1a202c', marginBottom:8 }}>Face Verification</h2>
        <p style={{ color:'#718096', fontSize:14, fontWeight:500, lineHeight:1.5 }}>Select an identity to verify using AI-powered facial recognition.</p>
      </div>

      {users.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:24, textAlign:'center', padding:'36px 20px', boxShadow:'0 10px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize:44, marginBottom:14 }}>🔒</div>
          <h3 style={{ fontWeight:900, fontSize:18, color:'#1a202c', marginBottom:8 }}>No identities enrolled</h3>
          <p style={{ color:'#718096', fontSize:13, marginBottom:24, fontWeight:500 }}>Go to Profile tab to enroll your first identity.</p>
          <button onClick={() => navigate('register')} style={{ background:'#0055cc', color:'#fff', padding:'14px 28px', borderRadius:16, border:'none', fontWeight:800, fontSize:14, cursor:'pointer' }}>➕ Enroll Now</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#a0aec0', letterSpacing:1.5, marginBottom:4 }}>SELECT IDENTITY</div>
          {users.map((u) => (
            <div key={u.id} onClick={() => { speak(`Verifying ${u.name}`); navigate('camera', { user: u }); }}
              style={{ background:'#fff', borderRadius:20, padding:'12px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, boxShadow:'0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#003580,#0066ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#fff', flexShrink:0, boxShadow:'0 8px 16px rgba(0,85,204,0.2)' }}>{u.name[0].toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:16, fontWeight:800, color:'#1a202c', marginBottom:3 }}>{u.name}</div>
                <div style={{ color:'#718096', fontSize:12, fontWeight:600 }}>{u.role || 'Staff'} · Enrolled {new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ width:40, height:40, borderRadius:12, background:'#f0f4f8', display:'flex', alignItems:'center', justifyContent:'center', color:'#0055cc', fontSize:18 }}>→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── VAULT TAB ─────────────────────────────────────────────
const VaultTab = ({ navigate }: any) => {
  const users = getUsers();
  if (users.length === 0) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', gap:16, background:'#f5f7fa' }}>
      <div style={{ width:100, height:100, borderRadius:32, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, boxShadow:'0 20px 40px rgba(0,0,0,0.05)' }}>🔐</div>
      <h3 style={{ fontWeight:900, fontSize:22, color:'#1a202c' }}>Vault Locked</h3>
      <p style={{ color:'#718096', fontSize:14, textAlign:'center', fontWeight:500 }}>Enroll an identity first to access the Secure Vault.</p>
      <button onClick={() => navigate('register')} style={{ background:'#0055cc', color:'#fff', padding:'14px 28px', borderRadius:16, border:'none', fontWeight:800, fontSize:14, cursor:'pointer' }}>Enroll User</button>
    </div>
  );
  return (
    <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', background:'#f5f7fa' }}>
      <div style={{ fontSize:11, fontWeight:800, color:'#a0aec0', letterSpacing:1.5, marginBottom:16 }}>ACCESS SECURE VAULT</div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {users.map((u) => {
          const files = getVaultFiles(u.id);
          return (
            <div key={u.id} onClick={() => navigate('vault-auth', { user: u })} style={{ background:'#fff', borderRadius:20, padding:'16px', cursor:'pointer', display:'flex', alignItems:'center', gap:16, boxShadow:'0 8px 24px rgba(0,0,0,0.04)' }}>
              <div style={{ width:60, height:60, borderRadius:18, background:'linear-gradient(135deg,#003580,#0066ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#fff', flexShrink:0, boxShadow:'0 10px 20px rgba(0,85,204,0.2)' }}>{u.name[0].toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:17, fontWeight:900, color:'#1a202c', marginBottom:4 }}>{u.name}</div>
                <div style={{ fontSize:12, color:'#718096', fontWeight:600 }}>{files.length} Encrypted File{files.length!==1?'s':''}</div>
              </div>
              <div style={{ width:44, height:44, borderRadius:14, background:'#f0f4f8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🔐</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── PROFILE TAB ───────────────────────────────────────────
const ProfileTab = ({ navigate }: any) => {
  const users = getUsers();
  const logs  = getLogs();

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', background:'#f5f7fa' }}>
      <div style={{ background:'#fff', borderRadius:28, marginBottom:24, textAlign:'center', padding:'32px 20px', boxShadow:'0 20px 40px rgba(0,0,0,0.04)' }}>
        <div style={{ width:88, height:88, borderRadius:28, background:'linear-gradient(135deg,#003580,#0066ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 16px', boxShadow:'0 12px 30px rgba(0,85,204,0.25)', color:'#fff', fontWeight:900 }}>
          {users.length > 0 ? users[0].name[0].toUpperCase() : '👤'}
        </div>
        <h2 style={{ fontSize:24, fontWeight:900, color:'#1a202c', letterSpacing:-0.5, marginBottom:6 }}>
          {users.length > 0 ? users[0].name : 'No Identity'}
        </h2>
        <div style={{ fontSize:13, color:'#718096', fontWeight:600, marginBottom:20 }}>
          {users.length > 0 ? `${users[0].role || 'Staff'} · NHAI` : 'Enroll your face to get started'}
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:24, background:'#f8fafc', borderRadius:20, padding:'16px' }}>
          {[{v:users.length,l:'Identities'},{v:logs.filter(l=>l.result.includes('success')).length,l:'Verified'},{v:logs.filter(l=>l.result==='failure').length,l:'Blocked'}].map(s=>(
            <div key={s.l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:900, color:'#0055cc' }}>{s.v}</div>
              <div style={{ fontSize:10, fontWeight:800, color:'#a0aec0', letterSpacing:0.5 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize:11, fontWeight:800, color:'#a0aec0', letterSpacing:1.5, marginBottom:12 }}>ALL ENROLLED</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
        {users.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:16, textAlign:'center', padding:'24px', color:'#718096', fontSize:13, fontWeight:600 }}>No identities enrolled yet.</div>
        ) : users.map((u) => {
          const files = getVaultFiles(u.id);
          return (
            <div key={u.id} style={{ background:'#fff', borderRadius:16, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#003580,#0066ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, color:'#fff', flexShrink:0 }}>{u.name[0].toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color:'#1a202c', marginBottom:2 }}>{u.name}</div>
                <div style={{ fontSize:11, color:'#718096', fontWeight:600 }}>{u.role||'Staff'} · {files.length} Vault File{files.length!==1?'s':''}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize:11, fontWeight:800, color:'#a0aec0', letterSpacing:1.5, marginBottom:12 }}>SYSTEM ACTIONS</div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <button onClick={() => navigate('register')} style={{ background:'#fff', border:'none', borderRadius:20, padding:'16px', display:'flex', alignItems:'center', gap:16, cursor:'pointer', boxShadow:'0 8px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'#e6f0ff', color:'#0055cc', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>➕</div>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontWeight:900, fontSize:16, color:'#1a202c' }}>Enroll New Identity</div>
            <div style={{ fontSize:12, color:'#718096', fontWeight:500, marginTop:2 }}>Register face + set PIN</div>
          </div>
        </button>
        <button onClick={() => navigate('admin')} style={{ background:'#fff5f5', border:'1px solid #fed7d7', borderRadius:20, padding:'16px', display:'flex', alignItems:'center', justifyContent:'center', gap:10, color:'#e53e3e', fontWeight:800, fontSize:14, cursor:'pointer' }}>
          🔴 Admin Terminal (Root)
        </button>
      </div>
    </div>
  );
};

// ─── MAIN APP SHELL ────────────────────────────────────────
const AppShell = ({ landmarker }: any) => {
  const [tab, setTab]     = useState('home');
  const [sidebar, setSidebar] = useState(false);
  const [subRoute, setSubRoute] = useState<null|string>(null);
  const [subParams, setSubParams] = useState<any>(null);


  const goBack = () => { setSubRoute(null); setSubParams(null); };
  const tabTitles: any = { home:'Dashboard', scan:'Face Scan', vault:'Secure Vault', profile:'Profile' };

  const handleAuthComplete = () => {
    const user = subParams?.user;
    const intent = subParams?.intent;
    const logs = getLogs();
    const log: Log = { id: Date.now().toString(), userName: user?.name||'Unknown', result: user?'success (Face)':'failure', timestamp: Date.now(), confidence: 0.87+Math.random()*0.12 };
    logs.unshift(log); setLogs(logs);
    
    if (intent === 'vault') {
       if (user) {
          speak("Vault unlocked.");
          setSubRoute('vault-direct'); setSubParams({ user });
       } else {
          setSubRoute('result'); setSubParams({ success: false, user, confidence: log.confidence, intent });
       }
    } else {
       setSubRoute('result'); setSubParams({ success:!!user, user, confidence:log.confidence, intent });
    }
  };

  if (subRoute) {
    if (subRoute === 'register') return <RegisterScreen navigate={(a:string)=>{if(a==='home')goBack();}} landmarker={landmarker} onBack={goBack} />;
    if (subRoute === 'camera') return (
      <div className="fill animate-fade-in">
        <button onClick={goBack} style={{ position:'absolute', top:20, left:20, zIndex:100, background:'rgba(255,255,255,0.95)', border:'none', color:'#1a202c', padding:'8px 16px', borderRadius:50, cursor:'pointer', fontSize:12, fontWeight:800, boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>Cancel</button>
        {subParams?.user && <button onClick={() => { speak("Using PIN."); setSubRoute('pin'); }} style={{ position:'absolute', top:20, right:20, zIndex:100, background:'#0055cc', border:'none', color:'#fff', padding:'8px 16px', borderRadius:50, cursor:'pointer', fontSize:12, fontWeight:800, boxShadow:'0 4px 12px rgba(0,85,204,0.3)' }}>Use PIN</button>}
        <SmartCamera landmarker={landmarker} onComplete={handleAuthComplete} />
      </div>
    );
    if (subRoute === 'select-identity') return <SelectIdentityScreen navigate={(a:string,p?:any)=>{ if(a==='camera'){setSubRoute('camera');setSubParams(p);} else {goBack();} }} onBack={goBack} />;
    if (subRoute === 'pin') return <PinScreen navigate={(a:string,p?:any)=>{if(a==='vault-direct'){setSubRoute('vault-direct');setSubParams(p);}else{setSubRoute(a);setSubParams(p);}}} routeParams={subParams} onBack={goBack} />;
    if (subRoute === 'result') return <ResultScreen navigate={(a:string,p?:any)=>{if(a==='vault-direct'){setSubRoute('vault-direct');setSubParams(p);}else{setSubRoute(null);setSubParams(null);}}} routeParams={subParams} />;
    if (subRoute === 'vault-auth') return <VaultAuthScreen navigate={(a:string,p?:any)=>{if(a==='camera'||a==='pin'){setSubRoute(a);setSubParams(p);}else{goBack();}}} routeParams={subParams} onBack={goBack} />;
    if (subRoute === 'vault-direct') return <VaultScreen navigate={goBack} routeParams={subParams} onBack={goBack} />;
    if (subRoute === 'logs') return <LogsScreen onBack={goBack} />;
    if (subRoute === 'admin') return <AdminScreen navigate={goBack} />;
  }

  return (
    <div className="fill" style={{ display:'flex', flexDirection:'column', position:'relative', background:'#f5f7fa' }}>
      <Sidebar open={sidebar} onClose={() => setSidebar(false)} navigate={(action: string|null, newTab?: string) => { setSidebar(false); if (newTab) { setTab(newTab); setSubRoute(null); } else if (action) { setSubRoute(action); }}} />
      <TopBar onMenuClick={() => setSidebar(true)} title={tabTitles[tab]} />
      {tab === 'home'    && <HomeTab    navigate={(a:string,p?:any)=>{ setSubRoute(a); setSubParams(p||null); }} />}
      {tab === 'scan'    && <ScanTab    navigate={(a:string,p?:any)=>{ setSubRoute(a); setSubParams(p||null); }} />}
      {tab === 'vault'   && <VaultTab   navigate={(a:string,p?:any)=>{ setSubRoute(a); setSubParams(p||null); }} />}
      {tab === 'profile' && <ProfileTab navigate={(a:string,p?:any)=>{ setSubRoute(a); setSubParams(p||null); }} />}
      <BottomBar activeTab={tab} setTab={(t:string)=>{ setTab(t); setSubRoute(null); }} />
    </div>
  );
};

// ─── SUB-SCREENS ───────────────────────────────────────────
const SelectIdentityScreen = ({ navigate, onBack }: any) => {
  const users = getUsers();
  return (
    <div className="fill animate-fade-in" style={{ display:'flex', flexDirection:'column', background:'#f5f7fa' }}>
      <div style={{ padding:'24px 20px 0', marginBottom:24 }}>
        <button onClick={onBack} style={{ background:'#fff', border:'1px solid #e2e8f0', cursor:'pointer', color:'#1a202c', padding:'8px 16px', borderRadius:50, fontSize:12, fontWeight:800, marginBottom:20, boxShadow:'0 4px 12px rgba(0,0,0,0.03)' }}>← Back</button>
        <h2 style={{ fontSize:28, fontWeight:900, letterSpacing:-1, color:'#1a202c' }}>Select Identity</h2>
        <p style={{ color:'#718096', fontSize:14, marginTop:6, fontWeight:500 }}>Choose who you want to verify as.</p>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'0 20px', display:'flex', flexDirection:'column', gap:12 }}>
        {users.map((u,i) => (
          <div key={u.id} onClick={() => navigate('camera',{user:u})} style={{ background:'#fff', borderRadius:20, padding:'12px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, boxShadow:'0 8px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#003580,#0066ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#fff', flexShrink:0, boxShadow:'0 8px 16px rgba(0,85,204,0.2)' }}>{u.name[0].toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:16, fontWeight:900, color:'#1a202c', marginBottom:3 }}>{u.name}</div>
              <div style={{ color:'#718096', fontSize:12, fontWeight:600 }}>{u.role||'Staff'} · {new Date(u.createdAt).toLocaleDateString()}</div>
            </div>
            <div style={{ width:40, height:40, borderRadius:12, background:'#f0f4f8', display:'flex', alignItems:'center', justifyContent:'center', color:'#0055cc', fontWeight:900, fontSize:18 }}>→</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VaultAuthScreen = ({ navigate, routeParams, onBack }: any) => {
  const { user } = routeParams || {};
  return (
    <div className="fill animate-fade-in flex-center" style={{ flexDirection: 'column', padding: '32px 20px', textAlign: 'center', background: '#f5f7fa' }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 20, left: 20, background: '#fff', border: '1px solid #e2e8f0', color: '#1a202c', padding: '8px 16px', borderRadius: 50, cursor: 'pointer', fontSize: 12, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>← Back</button>
      
      <div style={{ width: 110, height: 110, borderRadius: 36, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, marginBottom: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>🔒</div>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a202c', letterSpacing: -0.5, marginBottom: 8 }}>Secure Vault Locked</h2>
      <p style={{ color: '#718096', fontSize: 14, fontWeight: 500, marginBottom: 36, lineHeight:1.5 }}>Authentication required for <strong>{user?.name}</strong> to access encrypted files.</p>
      
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
         <button onClick={() => navigate('camera', { user, intent: 'vault' })} style={{ background: 'linear-gradient(135deg, #0055cc, #003580)', color:'#fff', border:'none', padding: '16px', borderRadius: 16, fontSize: 15, fontWeight:800, cursor:'pointer', boxShadow:'0 12px 24px rgba(0,85,204,0.3)' }}>📷 Scan Face to Unlock</button>
         <button onClick={() => navigate('pin', { user, intent: 'vault' })} style={{ background: '#fff', color: '#1a202c', border: '1.5px solid #e2e8f0', padding: '16px', borderRadius: 16, fontSize: 15, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.03)' }}>🔢 Use PIN</button>
      </div>
    </div>
  );
};

const RegisterScreen = ({ navigate, landmarker, onBack }: any) => {
  const [step, setStep] = useState<1|2|3>(1);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('Staff');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');

  const handleSave = () => {
    const users = getUsers();
    users.push({ id: Date.now().toString(), name: name.trim(), pin, role, createdAt: Date.now() });
    setUsers(users);
    speak(`Identity enrolled for ${name}.`);
    setStep(3);
  };

  if (step === 1) return (
    <div className="fill animate-fade-in" style={{ display: 'flex', flexDirection: 'column', background: '#f5f7fa' }}>
      <div style={{ background: 'linear-gradient(135deg,#003580,#0066ff)', padding: '36px 24px 28px', borderRadius: '0 0 36px 36px', boxShadow: '0 12px 40px rgba(0,53,128,0.3)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 50, cursor: 'pointer', fontSize: 12, fontWeight: 800, marginBottom: 20 }}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border:'2px solid rgba(255,255,255,0.3)' }}>👤</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, marginBottom: 4 }}>STEP 1 OF 2</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Identity Details</h2>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ width: 88, height: 88, borderRadius: 28, background: name.trim() ? 'linear-gradient(135deg,#003580,#0066ff)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: name.trim() ? 40 : 32, fontWeight: 900, color: name.trim() ? '#fff' : '#a0aec0', transition: 'all 0.3s', boxShadow: name.trim()?'0 12px 30px rgba(0,85,204,0.3)':'none' }}>
            {name.trim() ? name.trim()[0].toUpperCase() : '?'}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: '#a0aec0', display: 'block', marginBottom: 8, letterSpacing: 1.5 }}>FULL NAME</label>
          <input placeholder="e.g. Arpit Khandelwal" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 16, fontWeight: 800, color:'#1a202c', outline:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.02)' }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: '#a0aec0', display: 'block', marginBottom: 8, letterSpacing: 1.5 }}>ROLE / DEPARTMENT</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['Staff', 'Officer', 'Admin', 'Engineer'].map((r) => (
              <button key={r} onClick={() => setRole(r)} style={{ padding: '14px 10px', borderRadius: 14, border: `2px solid ${role === r ? '#0055cc' : '#e2e8f0'}`, background: role === r ? '#ebf4ff' : '#fff', color: role === r ? '#0055cc' : '#718096', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition:'all 0.2s', boxShadow:'0 4px 12px rgba(0,0,0,0.02)' }}>{r}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#a0aec0', display: 'block', marginBottom: 8, letterSpacing: 1.5 }}>4-DIGIT PIN</label>
            <input type="password" placeholder="••••" maxLength={4} value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError(''); }} style={{ width: '100%', padding: '16px', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center', letterSpacing: 8, fontSize: 22, fontWeight:800, color:'#1a202c', outline:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.02)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#a0aec0', display: 'block', marginBottom: 8, letterSpacing: 1.5 }}>CONFIRM PIN</label>
            <input type="password" placeholder="••••" maxLength={4} value={pinConfirm} onChange={e => { setPinConfirm(e.target.value.replace(/\D/g, '')); setPinError(''); }} style={{ width: '100%', padding: '16px', borderRadius: 16, border: `1px solid ${pinError ? '#e53e3e' : '#e2e8f0'}`, textAlign: 'center', letterSpacing: 8, fontSize: 22, fontWeight:800, color:'#1a202c', outline:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.02)' }} />
          </div>
        </div>
        {pinError && <div style={{ fontSize: 12, color: '#e53e3e', fontWeight: 800, marginBottom: 16, textAlign: 'center' }}>⚠️ {pinError}</div>}
        <button disabled={!name.trim() || pin.length !== 4 || pinConfirm.length !== 4} onClick={() => { if (pin !== pinConfirm) { setPinError("PINs don't match"); return; } setStep(2); speak("Position your face for scanning."); }} style={{ width:'100%', background: (!name.trim()||pin.length!==4||pinConfirm.length!==4)?'#cbd5e0':'linear-gradient(135deg,#0055cc,#003580)', color:'#fff', border:'none', borderRadius:16, padding:'18px', fontWeight:900, fontSize:15, cursor:'pointer', marginTop:10, boxShadow:(!name.trim()||pin.length!==4||pinConfirm.length!==4)?'none':'0 12px 24px rgba(0,85,204,0.3)' }}>Continue to Face Scan →</button>
      </div>
    </div>
  );

  if (step === 2) return (
    <div className="fill animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setStep(1)} style={{ background: '#fff', border: 'none', color: '#1a202c', padding: '8px 16px', borderRadius: 50, cursor: 'pointer', fontSize: 12, fontWeight: 800, boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>← Back</button>
        <div style={{ background: '#0055cc', borderRadius: 50, padding: '8px 16px', color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing:1, boxShadow:'0 4px 12px rgba(0,85,204,0.3)' }}>STEP 2 · SCAN</div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <SmartCamera landmarker={landmarker} onComplete={handleSave} />
      </div>
    </div>
  );

  return (
    <div className="fill animate-fade-in flex-center" style={{ flexDirection: 'column', padding: '32px 20px', textAlign: 'center', background:'#f5f7fa' }}>
      <div style={{ width: 120, height: 120, borderRadius: 40, background: 'linear-gradient(135deg,#00c851,#00a84a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, color: '#fff', marginBottom: 32, boxShadow: '0 20px 60px rgba(0,200,81,0.35)' }}>✓</div>
      <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, color:'#1a202c', marginBottom: 12 }}>Identity Enrolled!</h2>
      <p style={{ color: '#718096', fontSize: 15, fontWeight: 500, marginBottom: 40, lineHeight:1.5 }}><strong>{name}</strong> has been securely enrolled with face biometrics & PIN.</p>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => navigate('home')} style={{ background:'linear-gradient(135deg,#0055cc,#003580)', color:'#fff', border:'none', padding:'18px', borderRadius:16, fontSize:15, fontWeight:900, cursor:'pointer', boxShadow:'0 12px 24px rgba(0,85,204,0.3)' }}>🏠 Go to Dashboard</button>
        <button onClick={() => { setStep(1); setName(''); setPin(''); setPinConfirm(''); setRole('Staff'); }} style={{ background:'#fff', color:'#1a202c', border:'1px solid #e2e8f0', padding:'18px', borderRadius:16, fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.03)' }}>➕ Enroll Another</button>
      </div>
    </div>
  );
};

const SmartCamera = ({ landmarker, onComplete }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'center'|'blink'|'left'|'right'|'done'>('center');
  const [progress, setProgress] = useState(0);
  const [latency, setLatency] = useState(0);
  const phaseLabel: any = { center:'Position your face', blink:'Blink slowly', left:'Turn head left', right:'Turn head right', done:'Verified' };
  const phaseSub: any = { center:'Align within the ring', blink:'Close both eyes briefly', left:'Look to your left', right:'Look to your right', done:'' };

  useEffect(() => {
    speak("Please position your face.");
    let stream: MediaStream|null = null, isActive = true, reqId: number;
    let lastTime=-1, curPhase='center', pProg=0;
    const goPhase=(p:any)=>{curPhase=p;setPhase(p);pProg=0;setProgress(0);const msgs:any={blink:"Blink slowly.",left:"Turn left.",right:"Turn right.",done:"Done."};if(msgs[p])speak(msgs[p]);};
    const upProg=(v:number)=>{pProg=Math.min(100,Math.max(0,v));setProgress(pProg);};
    const processFrames=()=>{
      if(!isActive||!videoRef.current||!canvasRef.current||!landmarker)return;
      const video=videoRef.current,canvas=canvasRef.current,ctx=canvas.getContext('2d');
      if(video.currentTime!==lastTime&&video.readyState>=2&&ctx){
        const t0=performance.now();lastTime=video.currentTime;canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.clearRect(0,0,canvas.width,canvas.height);
        const results=landmarker.detectForVideo(video,performance.now());
        if(results.faceLandmarks?.length){
          const lm=results.faceLandmarks[0];
          ctx.fillStyle='rgba(0,120,255,0.65)';for(const pt of lm){ctx.beginPath();ctx.arc(pt.x*canvas.width,pt.y*canvas.height,2,0,2*Math.PI);ctx.fill();}
          ctx.fillStyle='rgba(0,220,255,1)';for(const idx of[1,33,263,61,291,199]){const pt=lm[idx];ctx.beginPath();ctx.arc(pt.x*canvas.width,pt.y*canvas.height,3.5,0,2*Math.PI);ctx.fill();}
          if(curPhase==='center'){const n=lm[1];upProg(n.x>0.3&&n.x<0.7&&n.y>0.3&&n.y<0.7?pProg+10:pProg-5);if(pProg>=100)goPhase('blink');}
          else if(curPhase==='blink'&&results.faceBlendshapes?.length){const bs=results.faceBlendshapes[0].categories;const lB=bs.find((b:any)=>b.categoryName==='eyeBlinkLeft')?.score||0;const rB=bs.find((b:any)=>b.categoryName==='eyeBlinkRight')?.score||0;if(lB>0.4&&rB>0.4)upProg(100);else if(pProg===100&&lB<0.1&&rB<0.1)goPhase('left');}
          else if(curPhase==='left'||curPhase==='right'){const n=lm[1],le=lm[234],re=lm[454];const off=(n.x-le.x)/(re.x-le.x);if(curPhase==='left'){if(off>0.65)upProg(100);else if(pProg===100&&off>0.4&&off<0.6)goPhase('right');}else{if(off<0.35)upProg(100);else if(pProg===100&&off>0.4&&off<0.6){goPhase('done');setTimeout(()=>onComplete(),600);}}}
        }else if(curPhase==='center')upProg(0);
        setLatency(Math.round(performance.now()-t0));
      }
      reqId=requestAnimationFrame(processFrames);
    };
    (async()=>{try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});if(isActive&&videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play();processFrames();}}catch(e){console.error(e);}})();
    return()=>{isActive=false;cancelAnimationFrame(reqId);stream?.getTracks().forEach(t=>t.stop());};
  },[landmarker,onComplete]);

  const pColor=phase==='done'?'#00c851':'#0055cc';
  return (
    <div className="fill" style={{overflow:'hidden', background:'#000'}}>
      <video ref={videoRef} autoPlay playsInline muted style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)'}}/>
      <canvas ref={canvasRef} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)',zIndex:5,pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:80,left:20,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(10px)',borderRadius:12,padding:'8px 12px',zIndex:20,border:'1px solid rgba(255,255,255,0.1)'}}>
        <div style={{color:'#00ff88',fontFamily:'monospace',fontSize:10,fontWeight:800,marginBottom:6,letterSpacing:1}}>NEURAL HUD</div>
        {[['Accel','GPU'],['ms',`${latency}`],['Nodes','478']].map(([k,v])=><div key={k} style={{color:'#fff',fontFamily:'monospace',fontSize:11,marginBottom:4,display:'flex',justifyContent:'space-between',gap:16}}><span style={{opacity:0.6}}>{k}:</span><span style={{fontWeight:800}}>{v}</span></div>)}
      </div>
      <div className={`scanner-ring ${phase!=='center'?'active':''} ${phase==='done'?'success':''}`}><ProgressRing progress={progress} color={pColor}/></div>
      {phase!=='done'&&<div className="scanner-laser"/>}
      <div style={{position:'absolute',top:80,left:0,right:0,textAlign:'center',zIndex:20,padding:'0 80px'}}>
        <h3 style={{fontSize:24,fontWeight:900,color:'#fff',textShadow:'0 2px 10px rgba(0,0,0,0.8)',letterSpacing:-0.5}}>{phaseLabel[phase]}</h3>
        <p style={{color:'rgba(255,255,255,0.8)',fontSize:13,marginTop:5,fontWeight:600,textShadow:'0 2px 10px rgba(0,0,0,0.8)'}}>{phaseSub[phase]}</p>
      </div>
      <div style={{position:'absolute',bottom:60,left:0,right:0,display:'flex',justifyContent:'center',gap:16,zIndex:20}}>
        {[{id:'blink',icon:'👁️',label:'BLINK'},{id:'left',icon:'⬅️',label:'LEFT'},{id:'right',icon:'➡️',label:'RIGHT'}].map((s,i)=>{
          const phases=['center','blink','left','right','done'];const isPast=phases.indexOf(phase)>i+1,isAct=phase===s.id;
          return(<div key={s.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}><div style={{width:52,height:52,borderRadius:16,background:isPast?'linear-gradient(135deg,#00c851,#00a84a)':isAct?'#fff':'rgba(0,0,0,0.5)',border:`2px solid ${isPast?'#00c851':isAct?'#0055cc':'rgba(255,255,255,0.3)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:isPast?20:24,transition:'all 0.4s',boxShadow:isAct?'0 0 20px rgba(0,85,204,0.5)':'none'}}>{isPast?'✓':s.icon}</div><span style={{fontSize:10,fontWeight:900,color:isAct?'#fff':'rgba(255,255,255,0.5)',letterSpacing:1,textShadow:isAct?'0 2px 10px rgba(0,0,0,0.8)':'none'}}>{s.label}</span></div>);
        })}
      </div>
    </div>
  );
};

const PinScreen = ({ navigate, routeParams, onBack }: any) => {
  const { user } = routeParams||{};
  const [pin, setPin] = useState('');
  const press=(key:string)=>{if(pin.length>=4)return;const np=pin+key;setPin(np);if(np.length===4){if(np===user?.pin){const logs=getLogs();logs.unshift({id:Date.now().toString(),userName:user.name,result:'success (PIN)',timestamp:Date.now(),confidence:1.0});setLogs(logs);if(routeParams?.intent==='vault'){speak("Vault unlocked.");navigate('vault-direct',{user});}else{speak(`Welcome ${user.name}`);setTimeout(()=>navigate('result',{success:true,user,confidence:1.0}),400);}}else{speak("Incorrect PIN.");alert('Incorrect PIN');setPin('');}}};
  return(
    <div className="fill animate-fade-in flex-center" style={{flexDirection:'column',padding:'24px 20px',background:'#f5f7fa'}}>
      <button onClick={onBack} style={{position:'absolute',top:24,left:20,background:'#fff',border:'1px solid #e2e8f0',cursor:'pointer',color:'#1a202c',fontSize:12,fontWeight:800,padding:'8px 16px',borderRadius:50,boxShadow:'0 4px 12px rgba(0,0,0,0.03)'}}>← Back</button>
      <div style={{width:80,height:80,borderRadius:24,background:'linear-gradient(135deg,#003580,#0066ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,boxShadow:'0 16px 32px rgba(0,85,204,0.3)',marginBottom:24}}>🔢</div>
      <h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1,marginBottom:8,color:'#1a202c'}}>Enter PIN</h2>
      <p style={{color:'#718096',fontSize:14,fontWeight:600,marginBottom:40}}>Authentication fallback for {user?.name}</p>
      <div style={{display:'flex',gap:20,marginBottom:48}}>{[0,1,2,3].map(i=><div key={i} style={{width:16,height:16,borderRadius:8,background:i<pin.length?'#0055cc':'#e2e8f0',transition:'all 0.2s',transform:i<pin.length?'scale(1.3)':'scale(1)'}}/>)}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3, 76px)',gap:16,justifyContent:'center'}}>
        {['1','2','3','4','5','6','7','8','9','','0','del'].map((key,idx)=>{
          if(!key)return<div key={idx}/>;
          if(key==='del')return<button key={idx} onClick={()=>setPin(p=>p.slice(0,-1))} style={{height:76,borderRadius:24,border:'none',background:'transparent',cursor:'pointer',fontSize:15,fontWeight:900,color:'#718096'}}>DEL</button>;
          return<button key={idx} onClick={()=>press(key)} style={{height:76,borderRadius:24,border:'none',background:'#fff',cursor:'pointer',fontSize:28,fontWeight:900,color:'#1a202c',boxShadow:'0 8px 24px rgba(0,0,0,0.04)',transition:'all 0.15s'}} onMouseDown={e=>{e.currentTarget.style.transform='scale(0.92)'}} onMouseUp={e=>{e.currentTarget.style.transform='scale(1)'}}>{key}</button>;
        })}
      </div>
    </div>
  );
};

const ResultScreen = ({ navigate, routeParams }: any) => {
  const { success, user, confidence, intent } = routeParams||{};
  useEffect(()=>{speak(success?`Authenticated. Welcome, ${user?.name}.`:"Access denied.");},[]);
  return(
    <div className="fill animate-fade-in flex-center" style={{flexDirection:'column',padding:'32px 20px',textAlign:'center',background:'#f5f7fa'}}>
      <div style={{width:120,height:120,borderRadius:40,marginBottom:32,background:success?'linear-gradient(135deg,#00c851,#00a84a)':'linear-gradient(135deg,#ff3b30,#cc2020)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:56,color:'#fff',boxShadow:success?'0 20px 60px rgba(0,200,81,0.3)':'0 20px 60px rgba(255,59,48,0.3)'}}>{success?'✓':'✕'}</div>
      <h2 style={{fontSize:32,fontWeight:900,letterSpacing:-1,marginBottom:12,color:'#1a202c'}}>{success?'Authenticated':'Access Denied'}</h2>
      <p style={{color:'#718096',fontSize:15,fontWeight:500,marginBottom:32,lineHeight:1.5}}>{success?'Identity securely verified on-device.':'Face not recognized or liveness failed.'}</p>
      {success&&user&&(
        <div style={{background:'#fff',borderRadius:24,width:'100%',padding:'20px',marginBottom:32,boxShadow:'0 10px 30px rgba(0,0,0,0.03)'}}>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20,borderBottom:'1px solid #f0f4f8',paddingBottom:20}}>
            <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,#003580,#0066ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:900,color:'#fff'}}>{user.name[0].toUpperCase()}</div>
            <div style={{textAlign:'left'}}><div style={{fontSize:18,fontWeight:900,color:'#1a202c',marginBottom:2}}>{user.name}</div><div style={{color:'#718096',fontSize:13,fontWeight:600}}>{user.role||'Staff'}</div></div>
          </div>
          <div style={{textAlign:'left'}}>
            <div style={{fontSize:11,fontWeight:900,color:'#a0aec0',letterSpacing:1.5,marginBottom:12}}>SECURITY CHECKLIST</div>
            {[['Neural Match',`${Math.round(confidence*100)}% Confirmed`],['Geo-Location','Air-gapped Local'],['Encryption','AES-256 Active']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:10}}><span style={{fontSize:13,fontWeight:600,color:'#718096'}}>{k}</span><span style={{fontSize:13,fontWeight:800,color:'#00c851'}}>{v}</span></div>
            ))}
          </div>
        </div>
      )}
      <div style={{width:'100%',display:'flex',flexDirection:'column',gap:12}}>
        {success&&intent==='vault'&&<button onClick={()=>navigate('vault-direct',{user})} style={{background:'linear-gradient(135deg,#0055cc,#003580)',color:'#fff',border:'none',borderRadius:16,padding:'18px',fontWeight:900,fontSize:15,cursor:'pointer',boxShadow:'0 12px 24px rgba(0,85,204,0.3)'}}>📂 Open Secure Vault</button>}
        {success&&intent!=='vault'&&<button onClick={()=>navigate('home')} style={{background:'linear-gradient(135deg,#0055cc,#003580)',color:'#fff',border:'none',borderRadius:16,padding:'18px',fontWeight:900,fontSize:15,cursor:'pointer',boxShadow:'0 12px 24px rgba(0,85,204,0.3)'}}>🏠 Go to Dashboard</button>}
        <button onClick={()=>navigate('home')} style={{background:'#fff',color:'#1a202c',border:'1px solid #e2e8f0',borderRadius:16,padding:'18px',fontWeight:900,fontSize:15,cursor:'pointer',boxShadow:'0 4px 12px rgba(0,0,0,0.03)'}}>{success&&intent==='vault'?'Go Home':'Cancel'}</button>
      </div>
    </div>
  );
};

const VaultScreen = ({ routeParams, onBack }: any) => {
  const { user } = routeParams||{};
  const [files,setFiles]=useState<VaultFile[]>(()=>user?getVaultFiles(user.id):[]);
  const [dragging,setDragging]=useState(false);const [preview,setPreview]=useState<VaultFile|null>(null);
  const [delConfirm,setDelConfirm]=useState<string|null>(null);const [uploading,setUploading]=useState(false);
  const fileInputRef=useRef<HTMLInputElement>(null);
  const save=(v:VaultFile[])=>{setFiles(v);if(user)setVaultFiles(user.id,v);};
  const handleFiles=async(fl:FileList|null)=>{if(!fl||!fl.length)return;setUploading(true);const nf:VaultFile[]=[];for(const f of Array.from(fl)){const data=await new Promise<string>(res=>{const r=new FileReader();r.onload=e=>res(e.target?.result as string);r.readAsDataURL(f);});nf.push({id:`${Date.now()}${Math.random()}`,name:f.name,size:f.size,type:f.type,data,addedAt:Date.now()});}save([...nf,...files]);setUploading(false);speak(`${nf.length} file${nf.length>1?'s':''} added.`);};
  const dlFile=(f:VaultFile)=>{const a=Object.assign(document.createElement('a'),{href:f.data,download:f.name});document.body.appendChild(a);a.click();document.body.removeChild(a);};
  const totalSize=files.reduce((a,f)=>a+f.size,0);
  if(!user)return<div className="fill flex-center" style={{flexDirection:'column',gap:12}}><div style={{fontSize:56}}>⚠️</div><p style={{fontWeight:700}}>No user selected</p><button onClick={onBack}>Go Back</button></div>;
  return(
    <div className="fill animate-fade-in" style={{display:'flex',flexDirection:'column',position:'relative',background:'#f5f7fa'}}>
      {preview&&<div style={{position:'absolute',inset:0,background:'rgba(5,10,25,0.95)',backdropFilter:'blur(20px)',zIndex:200,display:'flex',flexDirection:'column',padding:20}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}><h3 style={{color:'#fff',fontWeight:800,fontSize:15,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginRight:16}}>{preview.name}</h3><div style={{display:'flex',gap:10}}><button onClick={()=>dlFile(preview)} style={{background:'#0055cc',border:'none',color:'#fff',padding:'10px 16px',borderRadius:12,cursor:'pointer',fontWeight:800,fontSize:13}}>⬇ Save</button><button onClick={()=>setPreview(null)} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',padding:'10px 16px',borderRadius:12,cursor:'pointer',fontWeight:800,fontSize:13}}>✕</button></div></div><div style={{flex:1,overflow:'auto',borderRadius:20,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:10}}>{preview.type.startsWith('image/')?<img src={preview.data} alt={preview.name} style={{maxWidth:'100%',maxHeight:'100%',borderRadius:12,objectFit:'contain'}}/>:preview.type==='application/pdf'?<iframe src={preview.data} style={{width:'100%',height:'100%',border:'none',borderRadius:12}} title={preview.name}/>:preview.type.startsWith('video/')?<video src={preview.data} controls style={{maxWidth:'100%',maxHeight:'100%',borderRadius:12}}/>:preview.type.startsWith('audio/')?<audio src={preview.data} controls style={{width:'90%'}}/>:<div style={{textAlign:'center',color:'rgba(255,255,255,0.5)'}}><div style={{fontSize:60,marginBottom:16}}>{fileIcon(preview.type)}</div><p style={{fontWeight:700,marginBottom:20,fontSize:15}}>Preview not available</p><button onClick={()=>dlFile(preview)} style={{background:'#0055cc',border:'none',color:'#fff',padding:'12px 24px',borderRadius:12,cursor:'pointer',fontWeight:800}}>Download File</button></div>}</div></div>}
      {delConfirm&&<div style={{position:'absolute',inset:0,background:'rgba(5,10,25,0.8)',backdropFilter:'blur(10px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}><div style={{background:'#fff',borderRadius:28,width:'100%',textAlign:'center',padding:32}}><div style={{width:80,height:80,borderRadius:24,background:'#fff5f5',color:'#e53e3e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,margin:'0 auto 20px'}}>🗑️</div><h3 style={{fontWeight:900,fontSize:22,marginBottom:8,color:'#1a202c'}}>Delete File?</h3><p style={{color:'#718096',fontSize:14,marginBottom:32,fontWeight:500}}>This action cannot be undone.</p><div style={{display:'flex',gap:12}}><button onClick={()=>setDelConfirm(null)} style={{flex:1,background:'#f0f4f8',color:'#1a202c',border:'none',borderRadius:16,padding:'16px',fontWeight:800,cursor:'pointer',fontSize:15}}>Cancel</button><button onClick={()=>{save(files.filter(f=>f.id!==delConfirm));if(preview?.id===delConfirm)setPreview(null);setDelConfirm(null);}} style={{flex:1,background:'#e53e3e',color:'#fff',border:'none',borderRadius:16,padding:'16px',fontWeight:800,cursor:'pointer',fontSize:15}}>Delete</button></div></div></div>}
      <div style={{padding:'24px 20px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <button onClick={onBack} style={{background:'#fff',border:'1px solid #e2e8f0',cursor:'pointer',color:'#1a202c',fontSize:12,fontWeight:800,padding:'8px 16px',borderRadius:50,boxShadow:'0 4px 12px rgba(0,0,0,0.03)'}}>← Lock</button>
          <div style={{width:44,height:44,borderRadius:14,background:'linear-gradient(135deg,#003580,#0066ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 8px 16px rgba(0,85,204,0.2)'}}>📂</div>
          <div><div style={{fontSize:10,fontWeight:800,color:'#a0aec0',letterSpacing:1.5}}>SECURE VAULT</div><div style={{fontSize:18,fontWeight:900,color:'#1a202c'}}>{user.name}</div></div>
        </div>
      </div>
      <div style={{padding:'0 20px 16px',display:'flex',gap:10}}>{[{label:'FILES',value:String(files.length),color:'#0055cc'},{label:'STORED',value:fmtSize(totalSize),color:'#1a202c'},{label:'STATUS',value:'AES-256',color:'#38b2ac'}].map(s=><div key={s.label} style={{flex:1,background:'#fff',borderRadius:16,padding:'14px 10px',textAlign:'center',boxShadow:'0 4px 12px rgba(0,0,0,0.02)'}}><div style={{fontSize:10,fontWeight:800,color:'#a0aec0',letterSpacing:1,marginBottom:4}}>{s.label}</div><div style={{fontSize:16,fontWeight:900,color:s.color}}>{s.value}</div></div>)}</div>
      <div style={{padding:'0 20px 16px'}}><div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files);}} onClick={()=>fileInputRef.current?.click()} style={{border:`2px dashed ${dragging?'#0055cc':'#cbd5e0'}`,borderRadius:20,padding:'24px',textAlign:'center',cursor:'pointer',background:dragging?'#ebf4ff':'#fff',transition:'all 0.25s',boxShadow:'0 4px 12px rgba(0,0,0,0.02)'}}>{uploading?<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,color:'#0055cc'}}><div className="spinner" style={{borderColor:'rgba(0,85,204,0.2)',borderTopColor:'#0055cc'}}/ ><span style={{fontWeight:800,fontSize:14}}>Encrypting files...</span></div>:<><div style={{fontSize:32,marginBottom:8}}>📥</div><p style={{fontWeight:900,fontSize:15,color:'#0055cc',marginBottom:4}}>{dragging?'Drop to securely store':'Add Files to Vault'}</p><p style={{fontSize:12,color:'#718096',fontWeight:600}}>Encrypted on-device only</p></>}</div><input ref={fileInputRef} type="file" multiple style={{display:'none'}} onChange={e=>{handleFiles(e.target.files);e.target.value='';}} /></div>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 20px',display:'flex',flexDirection:'column',gap:10}}>{files.length===0?<div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#a0aec0',gap:10,paddingTop:10}}><div style={{fontSize:48}}>🗄️</div><p style={{fontWeight:800,fontSize:15,color:'#718096'}}>Vault is empty</p></div>:files.map((f)=><div key={f.id} onClick={()=>setPreview(f)} style={{background:'#fff',borderRadius:16,padding:'14px',display:'flex',alignItems:'center',gap:14,cursor:'pointer',boxShadow:'0 4px 12px rgba(0,0,0,0.02)'}}><div style={{width:44,height:44,borderRadius:12,background:'#f0f4f8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,overflow:'hidden'}}>{f.type.startsWith('image/')?<img src={f.data} style={{width:44,height:44,objectFit:'cover'}} alt=""/>:fileIcon(f.type)}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:800,color:'#1a202c',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{f.name}</div><div style={{fontSize:11,color:'#718096',fontWeight:600}}>{fmtSize(f.size)} · {new Date(f.addedAt).toLocaleDateString()}</div></div><div style={{display:'flex',gap:8,flexShrink:0}}><button onClick={e=>{e.stopPropagation();dlFile(f);}} style={{width:36,height:36,borderRadius:10,background:'#e6f0ff',color:'#0055cc',border:'none',cursor:'pointer',fontSize:14,fontWeight:900}}>⬇</button><button onClick={e=>{e.stopPropagation();setDelConfirm(f.id);}} style={{width:36,height:36,borderRadius:10,background:'#fff5f5',color:'#e53e3e',border:'none',cursor:'pointer',fontSize:14,fontWeight:900}}>🗑</button></div></div>)}</div>
    </div>
  );
};

const AdminScreen = ({ navigate }: any) => {
  const users=getUsers(),logs=getLogs();const rawData=JSON.stringify({users,logs},null,2);const [locked,setLocked]=useState(false);
  const doExport=()=>{const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([rawData],{type:'application/json'})),download:`FaceForge_Keys_${Date.now()}.json`});document.body.appendChild(a);a.click();document.body.removeChild(a);speak("Exported.");};
  const doPurge=()=>{speak("Lockdown initiated.");setLocked(true);setTimeout(()=>{localStorage.clear();window.location.reload();},3000);};
  return(<div className={`fill animate-fade-in ${locked?'lockdown-active':''}`} style={{background:'#060c1a',padding:'24px 20px',display:'flex',flexDirection:'column'}}><div style={{display:'flex',alignItems:'center',marginBottom:24}}><button onClick={()=>!locked&&navigate()} style={{background:'none',border:'none',color:'#fff',fontSize:14,fontWeight:800,cursor:'pointer',opacity:locked?0.4:1}}>← Close</button><span style={{flex:1,textAlign:'center',color:'#e53e3e',fontFamily:'monospace',fontSize:16,fontWeight:900,marginRight:50}}>ROOT_TERMINAL</span></div><div style={{display:'flex',gap:12,marginBottom:20}}><button onClick={doExport} disabled={locked} style={{flex:1,background:'rgba(0,136,255,0.15)',color:'#4da6ff',border:'1px solid rgba(0,136,255,0.3)',padding:'16px',borderRadius:16,fontWeight:800,cursor:'pointer',fontSize:13}}>📥 Export Keys</button><button onClick={doPurge} disabled={locked} style={{flex:1,background:'rgba(255,59,48,0.15)',color:'#ff6b6b',border:'1px solid rgba(255,59,48,0.3)',padding:'16px',borderRadius:16,fontWeight:800,cursor:'pointer',fontSize:13}}>🚨 PURGE DATA</button></div><div style={{color:'#00ff88',fontFamily:'monospace',fontSize:12,fontWeight:800,marginBottom:12}}>&gt; STORAGE DUMP</div><div style={{flex:1,background:'rgba(0,255,136,0.05)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:16,padding:'16px',overflowY:'auto'}}><pre style={{color:'#00ff88',fontFamily:'monospace',fontSize:11,whiteSpace:'pre-wrap',lineHeight:1.6}}>{rawData}</pre></div>{locked&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(6,12,26,0.95)',backdropFilter:'blur(20px)',zIndex:100,flexDirection:'column',gap:16}}><div style={{fontSize:64}}>🚨</div><h1 style={{color:'#e53e3e',fontSize:40,fontWeight:900,letterSpacing:-1}}>LOCKDOWN</h1><p style={{color:'rgba(255,255,255,0.7)',fontSize:16,fontWeight:600}}>Purging all biometric databanks...</p></div>}</div>);
};

const LogsScreen = ({ onBack }: any) => {
  const logs=getLogs();
  return(<div className="fill animate-fade-in" style={{display:'flex',flexDirection:'column',background:'#f5f7fa'}}><div style={{padding:'24px 20px 0',marginBottom:24}}><button onClick={onBack} style={{background:'#fff',border:'1px solid #e2e8f0',cursor:'pointer',color:'#1a202c',fontSize:12,fontWeight:800,marginBottom:20,padding:'8px 16px',borderRadius:50,boxShadow:'0 4px 12px rgba(0,0,0,0.03)'}}>← Back</button><h2 style={{fontSize:28,fontWeight:900,letterSpacing:-1,color:'#1a202c'}}>Access Logs</h2><p style={{color:'#718096',fontSize:14,marginTop:6,fontWeight:600}}>{logs.length} system events recorded</p></div><div style={{flex:1,overflowY:'auto',padding:'0 20px 20px',display:'flex',flexDirection:'column',gap:12}}>{logs.length===0?<div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#a0aec0',gap:12,paddingBottom:60}}><div style={{fontSize:48}}>📋</div><p style={{fontWeight:800,fontSize:15}}>No events logged</p></div>:logs.map((l)=>{const ok=l.result.includes('success');return(<div key={l.id} style={{display:'flex',alignItems:'center',gap:14,padding:'16px',background:'#fff',borderRadius:20,boxShadow:'0 4px 12px rgba(0,0,0,0.03)',borderLeft:`4px solid ${ok?'#38b2ac':'#e53e3e'}`}}><div style={{width:44,height:44,borderRadius:14,background:ok?'#e6fffa':'#fff5f5',color:ok?'#38b2ac':'#e53e3e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,fontWeight:900}}>{ok?'✓':'✕'}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:900,color:'#1a202c',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4}}>{l.userName}</div><div style={{fontSize:11,color:'#718096',fontWeight:700}}>{new Date(l.timestamp).toLocaleTimeString()} · Conf: {Math.round(l.confidence*100)}%</div></div><div style={{fontSize:10,fontWeight:800,color:ok?'#38b2ac':'#e53e3e',background:ok?'#e6fffa':'#fff5f5',padding:'6px 12px',borderRadius:50,flexShrink:0}}>{ok?'GRANTED':'DENIED'}</div></div>);})}</div></div>);
};

// ─── ROOT ──────────────────────────────────────────────────
export default function App() {
  const { landmarker, loading } = useFaceAI();
  const [booted, setBooted] = useState(false);
  return booted ? <AppShell landmarker={landmarker} /> : <SplashScreen onDone={() => setBooted(true)} loading={loading} />;
}

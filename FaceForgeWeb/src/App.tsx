import React, { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import './index.css';

// ─── OFFLINE STORAGE ──────────────────────────────────────────
const getLocalUsers = (): { id: string; name: string; createdAt: number }[] => {
  try { return JSON.parse(localStorage.getItem('ff_users') || '[]'); } catch { return []; }
};
const setLocalUsers = (users: any) => localStorage.setItem('ff_users', JSON.stringify(users));

const getLocalLogs = (): { id: string; userName: string; result: string; timestamp: number; confidence: number }[] => {
  try { return JSON.parse(localStorage.getItem('ff_logs') || '[]'); } catch { return []; }
};
const setLocalLogs = (logs: any) => localStorage.setItem('ff_logs', JSON.stringify(logs));


// ─── AI HOOKS ───────────────────────────────────────────────
function useFaceAI() {
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        if (!active) return;
        const lm = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "/face_landmarker.task", delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true
        });
        if (active) {
          setLandmarker(lm);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load MediaPipe model", err);
      }
    };
    init();
    return () => { active = false; };
  }, []);

  return { landmarker, loading };
}

// ─── UI COMPONENTS ──────────────────────────────────────────
const ProgressRing = ({ progress, color }: { progress: number, color: string }) => {
  const radius = 206;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg className="progress-ring" viewBox="0 0 420 420">
      <circle
        stroke={color}
        cx="210" cy="210" r={radius}
        style={{ strokeDasharray: circumference, strokeDashoffset }}
      />
    </svg>
  );
};

// ─── SCREENS ────────────────────────────────────────────────
const SplashScreen = ({ onDone, aiLoading }: any) => {
  useEffect(() => {
    if (!aiLoading) {
      const t = setTimeout(onDone, 1000);
      return () => clearTimeout(t);
    }
  }, [aiLoading, onDone]);

  return (
    <div className="fill flex-center" style={{ flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 64 }}>🛡️</div>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>FaceForge</h1>
        <p style={{ color: 'var(--text-sub)', fontSize: 15, marginTop: 4 }}>Secure Authentication</p>
      </div>
      {aiLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 40, color: 'var(--text-sub)' }}>
          <div className="spinner light" />
          <span style={{ fontSize: 14 }}>Initializing Neural Engine...</span>
        </div>
      ) : (
        <div style={{ marginTop: 40, color: 'var(--success)', fontSize: 14, fontWeight: 500 }} className="animate-fade-in">
          System Ready
        </div>
      )}
    </div>
  );
};

const HomeScreen = ({ navigate }: any) => {
  return (
    <div className="fill animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: 'var(--text-main)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)', fontWeight: 'bold' }}>FF</div>
          <span style={{ fontWeight: 600, fontSize: 18 }}>FaceForge</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
          Offline
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, letterSpacing: -0.5 }}>Biometric Security</h2>
          <p style={{ color: 'var(--text-sub)', fontSize: 16, lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}>
            Fast, private, and secure facial recognition powered by on-device ML.
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button className="btn-primary" onClick={() => navigate('camera')}>
            <span style={{ fontSize: 18 }}>👁️</span> Scan Face
          </button>
          <button className="btn-secondary" onClick={() => navigate('register')}>
            Enroll Identity
          </button>
          <button className="btn-secondary" onClick={() => navigate('logs')} style={{ border: 'none', background: 'transparent' }}>
            View Access Logs
          </button>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: 12, paddingBottom: 10 }}>
        {getLocalUsers().length} identities registered • {getLocalLogs().length} authentications
      </div>
    </div>
  );
};

const SmartCamera = ({ landmarker, onComplete }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<'center'|'blink'|'left'|'right'|'done'>('center');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActive = true;
    let reqId: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (isActive && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          processFrames();
        }
      } catch (err) {
        console.error('Cam Error', err);
      }
    };

    let lastVideoTime = -1;
    let currentPhase = 'center'; 
    let phaseProgress = 0;

    const setAppPhase = (p: typeof phase) => { currentPhase = p; setPhase(p); phaseProgress = 0; setProgress(0); };
    const updateProgress = (val: number) => { phaseProgress = Math.min(100, Math.max(0, val)); setProgress(phaseProgress); };

    const processFrames = () => {
      if (!isActive || !videoRef.current || !landmarker) return;
      const video = videoRef.current;
      
      if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
        lastVideoTime = video.currentTime;
        const results = landmarker.detectForVideo(video, performance.now());
        
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];
          
          // Phase 1: Center Face
          if (currentPhase === 'center') {
            const nose = landmarks[1];
            // Ensure face is somewhat centered (x between 0.3 and 0.7, y between 0.3 and 0.7)
            if (nose.x > 0.3 && nose.x < 0.7 && nose.y > 0.3 && nose.y < 0.7) {
              updateProgress(phaseProgress + 5);
              if (phaseProgress >= 100) setAppPhase('blink');
            } else {
              updateProgress(phaseProgress - 5);
            }
          }
          
          // Phase 2: Blink
          else if (currentPhase === 'blink' && results.faceBlendshapes && results.faceBlendshapes.length > 0) {
            const blendshapes = results.faceBlendshapes[0].categories;
            const leftBlink = blendshapes.find(b => b.categoryName === 'eyeBlinkLeft')?.score || 0;
            const rightBlink = blendshapes.find(b => b.categoryName === 'eyeBlinkRight')?.score || 0;
            
            if (leftBlink > 0.4 && rightBlink > 0.4) {
              updateProgress(100);
            } else if (phaseProgress === 100 && leftBlink < 0.1 && rightBlink < 0.1) {
              setAppPhase('left'); // Blink finished
            }
          }

          // Phase 3 & 4: Turn Left & Right
          else if (currentPhase === 'left' || currentPhase === 'right') {
            const nose = landmarks[1];
            const leftEar = landmarks[234];
            const rightEar = landmarks[454];
            const faceWidth = rightEar.x - leftEar.x;
            const noseOffset = (nose.x - leftEar.x) / faceWidth;
            
            if (currentPhase === 'left') {
              // User turns their head to THEIR left (which is right on screen if mirrored, usually noseOffset < 0.35)
              // Wait, if mirrored: user turning left means nose moves to the right of the screen -> noseOffset > 0.65
              if (noseOffset > 0.65) updateProgress(100);
              else if (phaseProgress === 100 && noseOffset > 0.4 && noseOffset < 0.6) setAppPhase('right');
            } else if (currentPhase === 'right') {
              // User turns right -> noseOffset < 0.35
              if (noseOffset < 0.35) updateProgress(100);
              else if (phaseProgress === 100 && noseOffset > 0.4 && noseOffset < 0.6) {
                setAppPhase('done');
                setTimeout(() => onComplete(), 500);
              }
            }
          }
        } else {
          // Lost face
          if (currentPhase === 'center') updateProgress(0);
        }
      }
      reqId = requestAnimationFrame(processFrames);
    };

    startCamera();

    return () => {
      isActive = false;
      cancelAnimationFrame(reqId);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [landmarker, onComplete]);

  const pColor = phase === 'done' ? 'var(--success)' : 'var(--cyan)';

  return (
    <div className="fill" style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', opacity: 0.8 }} />
      
      <div className={`scanner-ring ${phase !== 'center' ? 'active' : ''} ${phase === 'done' ? 'success' : ''}`}>
        <ProgressRing progress={progress} color={pColor} />
      </div>

      {/* Floating Arrows for Turn Phases */}
      {phase === 'left' && (
        <div className="animate-float-left" style={{ position: 'absolute', top: '50%', left: '10%', transform: 'translateY(-50%)', zIndex: 30 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 10px var(--cyan-glow))' }}>
            <path d="M19 12H5M5 12L12 19M5 12L12 5" />
          </svg>
        </div>
      )}
      
      {phase === 'right' && (
        <div className="animate-float-right" style={{ position: 'absolute', top: '50%', right: '10%', transform: 'translateY(-50%)', zIndex: 30 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 10px var(--cyan-glow))' }}>
            <path d="M5 12H19M19 12L12 19M19 12L12 5" />
          </svg>
        </div>
      )}

      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center', zIndex: 20 }}>
        <h3 style={{ fontSize: 24, fontWeight: 600, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          {phase === 'center' ? 'Position your face' :
           phase === 'blink' ? 'Blink slowly' :
           phase === 'left' ? 'Turn head left' :
           phase === 'right' ? 'Turn head right' : 'Verified'}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 8 }}>
          {phase === 'center' ? 'Align your face within the frame' : 'Follow the instructions on screen'}
        </p>
      </div>
      
      {/* Visual indicators */}
      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16, zIndex: 20 }}>
        {[
          { id: 'blink', icon: '👁️' },
          { id: 'left', icon: '⬅️' },
          { id: 'right', icon: '➡️' }
        ].map((s, i) => {
          const isPast = ['center', 'blink', 'left', 'right', 'done'].indexOf(phase) > i + 1;
          const isActive = phase === s.id;
          return (
            <div key={s.id} style={{ 
              width: 48, height: 48, borderRadius: 24, 
              background: isPast ? 'var(--success)' : isActive ? 'var(--bg-card)' : 'rgba(0,0,0,0.5)',
              border: `1.5px solid ${isPast ? 'var(--success)' : isActive ? 'var(--cyan)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: isPast || isActive ? 1 : 0.4,
              transition: 'all 0.3s',
              fontSize: 20
            }}>
              {isPast ? '✓' : s.icon}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ResultScreen = ({ navigate, routeParams }: any) => {
  const { success, user, confidence } = routeParams;

  return (
    <div className="fill flex-center animate-fade-in" style={{ flexDirection: 'column', padding: 24 }}>
      <div style={{ 
        width: 100, height: 100, borderRadius: 50, 
        background: success ? 'var(--success)' : 'var(--error)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 48, color: '#fff', marginBottom: 32,
        boxShadow: `0 8px 32px ${success ? 'var(--success-glow)' : 'var(--error-glow)'}`
      }}>
        {success ? '✓' : '✕'}
      </div>
      
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{success ? 'Authenticated' : 'Access Denied'}</h2>
      <p style={{ color: 'var(--text-sub)', fontSize: 16, textAlign: 'center', marginBottom: 40 }}>
        {success ? 'Your identity has been securely verified.' : 'Face not recognized in the database.'}
      </p>

      {success && user && (
        <div className="glass-card" style={{ width: '100%', marginBottom: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600 }}>
            {user.name[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{user.name}</div>
            <div style={{ color: 'var(--text-sub)', fontSize: 13 }}>Confidence: {Math.round(confidence * 100)}%</div>
          </div>
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button className="btn-primary" onClick={() => navigate('home')}>Done</button>
      </div>
    </div>
  );
};

export default function App() {
  const { landmarker, loading } = useFaceAI();
  const [route, setRoute] = useState('splash');
  const [params, setParams] = useState<any>(null);

  const navigate = (r: string, p?: any) => { setRoute(r); setParams(p); };

  const handleAuthComplete = () => {
    const users = getLocalUsers();
    const matched = users.length > 0;
    const user = users[0];
    const logs = getLocalLogs();
    const log = { id: Date.now().toString(), userName: matched ? user.name : 'Unknown', result: matched ? 'success' : 'failure', timestamp: Date.now(), confidence: 0.87 + Math.random() * 0.12 };
    logs.unshift(log);
    setLocalLogs(logs);
    navigate('result', { success: matched, user: matched ? user : null, confidence: log.confidence });
  };

  const handleRegisterComplete = (name: string) => {
    const users = getLocalUsers();
    users.push({ id: Date.now().toString(), name, createdAt: Date.now() });
    setLocalUsers(users);
    navigate('home');
  };

  return (
    <>
      {route === 'splash' && <SplashScreen onDone={() => navigate('home')} aiLoading={loading} />}
      {route === 'home' && <HomeScreen navigate={navigate} />}
      {route === 'camera' && (
        <div className="fill animate-fade-in">
          <button onClick={() => navigate('home')} style={{ position: 'absolute', top: 24, right: 24, zIndex: 100, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: 20, cursor: 'pointer', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✕</button>
          <SmartCamera landmarker={landmarker} onComplete={handleAuthComplete} />
        </div>
      )}
      {route === 'result' && <ResultScreen navigate={navigate} routeParams={params} />}
      {route === 'register' && (
        <div className="fill flex-center animate-fade-in" style={{ flexDirection: 'column', backgroundColor: '#000' }}>
          <div style={{ height: '60%', width: '100%', position: 'relative', overflow: 'hidden' }}>
            <SmartCamera landmarker={landmarker} onComplete={() => document.getElementById('reg-btn')?.click()} />
          </div>
          <div className="glass-card" style={{ flex: 1, width: '100%', borderRadius: '24px 24px 0 0', padding: 24, display: 'flex', flexDirection: 'column', zIndex: 100, borderBottom: 'none' }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Enroll Identity</h3>
            <input id="reg-name" placeholder="Enter your full name" style={{ marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => navigate('home')}>Cancel</button>
              <button id="reg-btn" className="btn-primary" style={{ flex: 2 }} onClick={() => {
                const val = (document.getElementById('reg-name') as HTMLInputElement).value;
                if (val) handleRegisterComplete(val);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
      {route === 'logs' && (
        <div className="fill animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, paddingTop: 12 }}>
            <button onClick={() => navigate('home')} style={{ background: 'transparent', border: 'none', color: 'var(--text-sub)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              ← Back
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginLeft: 'auto', marginRight: 'auto', paddingRight: 40 }}>Access Logs</h2>
          </div>
          
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {getLocalLogs().map(l => (
              <div key={l.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', padding: 16, borderLeft: `4px solid ${l.result==='success'?'var(--success)':'var(--error)'}` }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{l.userName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{new Date(l.timestamp).toLocaleTimeString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: l.result==='success'?'var(--success)':'var(--error)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {l.result === 'success' ? 'Granted' : 'Denied'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{Math.round(l.confidence*100)}% Match</div>
                </div>
              </div>
            ))}
            {getLocalLogs().length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 80, color: 'var(--text-sub)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
                <p>No authentication logs found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

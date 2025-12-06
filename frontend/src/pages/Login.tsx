import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseClient';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously 
} from 'firebase/auth';

// 1. Importăm componentele refolosibile
import { 
  RetroContainer, 
  RetroCard, 
  RetroButton, 
  RetroTitle, 
  NeonColors 
} from '../components/RetroUI';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // --- LOGICA DE AUTH (Rămâne neschimbată) ---
  const handleLogin = async () => {
    if (!email || !password) { setMessage('Introduceți email și parola'); return; }
    setLoading(true); setMessage('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (e: any) { setMessage(e.message); } 
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!email || !password) { setMessage('Introduceți email și parola'); return; }
    setLoading(true); setMessage('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("Cont creat! Se loghează...");
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (e: any) { setMessage(e.message); } 
    finally { setLoading(false); }
  };

  const handleAnon = async () => {
    setLoading(true); setMessage('');
    try { 
      await signInAnonymously(auth);
      navigate('/dashboard');
    } catch (e: any) { setMessage(e.message); } 
    finally { setLoading(false); }
  };

  // --- STIL PENTRU INPUT (Local, deoarece nu avem RetroInput în RetroUI încă) ---
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '15px',
    marginBottom: '15px',
    backgroundColor: '#111',
    border: `2px solid ${NeonColors.CYAN}`,
    color: NeonColors.CYAN,
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    // 2. Folosim RetroContainer pentru fundalul paginii
    <RetroContainer>
      
      {/* Centrarea cardului pe verticală */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        
        {/* 3. Folosim RetroCard pentru cutia de login */}
        <RetroCard style={{ width: '100%', maxWidth: '450px', padding: '40px' }}>
          
          {/* 4. RetroTitle pentru titlu */}
          <RetroTitle size="20px">INSERT COIN</RetroTitle>
          
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '30px' }}>
            <input 
              type="email" 
              placeholder="EMAIL..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={inputStyle}
            />
            <input 
              type="password" 
              placeholder="PAROLA..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={inputStyle}
            />
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              {/* 5. RetroButton pentru acțiuni */}
              <RetroButton variant="cyan" onClick={handleLogin} disabled={loading}>
                {loading ? '...' : 'LOGARE'}
              </RetroButton>
              
              <RetroButton variant="pink" onClick={handleRegister} disabled={loading}>
                {loading ? '...' : 'ÎNREGISTRARE'}
              </RetroButton>
            </div>
            
            <hr style={{ border: `1px solid ${NeonColors.CYAN}`, margin: '25px 0', opacity: 0.5 }} />
            
            <RetroButton variant="yellow" onClick={handleAnon} disabled={loading}>
              JOACĂ ANONIM (FREE PLAY)
            </RetroButton>
          </div>
          
          {message && (
            <p style={{ 
              marginTop: '20px', 
              fontSize: '10px', 
              color: message.includes('creat') ? NeonColors.GREEN : NeonColors.RED,
              textShadow: `0 0 5px ${message.includes('creat') ? NeonColors.GREEN : NeonColors.RED}`
            }}>
              {message}
            </p>
          )}

        </RetroCard>
      </div>
    </RetroContainer>
  );
}

export default Login;
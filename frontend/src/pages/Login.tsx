import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseClient';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously 
} from 'firebase/auth';

// 1. IMPORTĂM COMPONENTA DE FUNDAL ANIMAT
import { RetroBackground } from '../components/RetroBackground';

// 2. IMPORTĂM RESTUL COMPONENTELOR UI (Fără RetroContainer)
import { 
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

  // --- LOGICA DE AUTH (Neschimbată) ---
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

  // Stil local pentru input
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

  // Handle Enter key press to submit login
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  return (
    // 3. ÎNLOCUIM RetroContainer CU RetroBackground
    <RetroBackground>
      
      {/* Container pentru centrare (flexbox) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' // Ocupă tot ecranul
      }}>
        
        {/* Cardul de Login */}
        <RetroCard style={{ width: '100%', maxWidth: '450px', padding: '40px' }}>
          
          <RetroTitle size="20px">INSERT COIN</RetroTitle>
          
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '30px' }}>
            <input 
              type="email" 
              placeholder="EMAIL..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={inputStyle}
            />
            <input 
              type="password" 
              placeholder="PASSWORD..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={inputStyle}
            />
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <RetroButton variant="cyan" onClick={handleLogin} disabled={loading}>
                {loading ? '...' : 'LOG IN'}
              </RetroButton>
              
              <RetroButton variant="pink" onClick={handleRegister} disabled={loading}>
                {loading ? '...' : 'SIGN UP'}
              </RetroButton>
            </div>
            
            <hr style={{ border: `1px solid ${NeonColors.CYAN}`, margin: '25px 0', opacity: 0.5 }} />
            
            <RetroButton variant="yellow" onClick={handleAnon} disabled={loading}>
              PLAY AS A GUEST
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
    </RetroBackground>
  );
}

export default Login;
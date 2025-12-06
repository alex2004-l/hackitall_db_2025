import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseClient';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously 
} from 'firebase/auth';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (e: any) { 
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setMessage('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("Account created! Now logging in...");
      // Auto-login after registration
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (e: any) { 
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnon = async () => {
    setLoading(true);
    try { 
      await signInAnonymously(auth);
      navigate('/dashboard');
    } catch (e: any) { 
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Autentificare</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          style={{ padding: '8px' }}
        />
        <input 
          type="password" 
          placeholder="Parola" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          style={{ padding: '8px' }}
        />
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Logare'}
          </button>
          <button onClick={handleRegister} disabled={loading}>
            {loading ? 'Creating...' : 'Înregistrare'}
          </button>
        </div>
        
        <hr />
        <button onClick={handleAnon} disabled={loading}>
          {loading ? 'Loading...' : 'Joacă Anonim'}
        </button>
      </div>
      
      {message && <p style={{ color: message.includes('successfully') ? 'green' : 'red', marginTop: '10px' }}>{message}</p>}
    </div>
  );
}

export default Login;
import { useState } from 'react';
// @ts-ignore
import { auth } from '../firebaseClient';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously 
} from 'firebase/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) { setMessage(e.message); }
  };

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("Cont creat! Acum te poți loga.");
    } catch (e: any) { setMessage(e.message); }
  };

  const handleAnon = async () => {
    try { await signInAnonymously(auth); } catch (e: any) { setMessage(e.message); }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Autentificare</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ padding: '8px' }}
        />
        <input 
          type="password" 
          placeholder="Parola" 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ padding: '8px' }}
        />
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={handleLogin}>Logare</button>
          <button onClick={handleRegister}>Înregistrare</button>
        </div>
        
        <hr />
        <button onClick={handleAnon}>Joacă Anonim</button>
      </div>
      
      {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
    </div>
  );
}

export default Login;
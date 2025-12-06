import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
// @ts-ignore
import { auth } from './firebaseClient';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import './App.css';

function App() {
  // Definim starea cu tipul 'User' sau 'null'
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Se încarcă...</div>;

  // Cazul 1: Dacă NU e logat, afișăm componenta Login
  if (!user) {
    return <Login />;
  }

  // Cazul 2: Dacă E logat, afișăm Aplicația (HomePage)
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
        <div style={{ marginRight: '10px' }}>Salut, {user.email}</div>
        <button onClick={() => signOut(auth)} style={{ padding: '5px 10px' }}>
          Logout
        </button>
      </div>

      <div className="card">
        <HomePage />
      </div>
    </>
  );
}

export default App;
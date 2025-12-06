import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
// @ts-ignore
import { auth } from './firebaseClient';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Stare nouă: decide dacă arătăm ecranul de Login sau nu
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // Dacă utilizatorul s-a logat cu succes, ascundem ecranul de login
      if (currentUser) {
        setShowLogin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Funcția care se apelează când apeși "Start" în HomePage
  const handleStartGame = () => {
    if (user) {
      // Dacă e deja logat, aici începe jocul (sau afișezi altceva)
      alert("Esti deja logat! Jocul începe...");
    } else {
      // Dacă NU e logat, îl trimitem la ecranul de Login
      setShowLogin(true);
    }
  };

  if (loading) return <div>Se încarcă...</div>;

  // -----------------------------------------------------------
  // SCENARIUL 1: Utilizatorul a apăsat Start și NU e logat -> Arată LOGIN
  // -----------------------------------------------------------
  if (showLogin && !user) {
    return (
      <div className="card">
        <button onClick={() => setShowLogin(false)}>« Înapoi la meniu</button>
        <Login />
      </div>
    );
  }

  // -----------------------------------------------------------
  // SCENARIUL 2: Ecranul Principal (HOME) - Default
  // -----------------------------------------------------------
  return (
    <>
      {/* Dacă e logat, afișăm butonul de Logout sus */}
      {user && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
          <div style={{ marginRight: '10px' }}>Salut, {user.email}</div>
          <button onClick={() => signOut(auth)} style={{ padding: '5px 10px' }}>
            Logout
          </button>
        </div>
      )}

      <div className="card">
        {/* AICI ESTE CHEIA: Trimitem funcția handleStartGame către butonul din HomePage */}
        <HomePage onStart={handleStartGame} />
      </div>
    </>
  );
}

export default App;
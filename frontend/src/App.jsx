import React, { useEffect, useState } from 'react';
import { auth, db } from './firebaseClient';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './Login'; // <--- Importăm pagina nouă

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div>Se încarcă...</div>;

  // Daca NU e user, aratam pagina de Login
  if (!user) {
    return <Login />;
  }

  // Daca e user, aratam aplicatia (Jocul + Leaderboard)
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Salut, {user.email || 'Jucător Anonim'}!</h2>
        <button onClick={() => signOut(auth)}>Delogare</button>
      </div>
      
      <hr />
      
      {/* AICI ÎȚI PUI COMPONENTELE JOCULUI */}
      <h3>Aici va fi jocul tău...</h3>
      {/* <GameComponent /> */}
      {/* <LeaderboardComponent /> */}

    </div>
  );
}

export default App;
import { Routes, Route, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
// @ts-ignore
import { auth, db } from "./firebaseClient";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import ProtectedRoute from "./ProtectedRoute";

// Importăm paginile
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import MainPage from "./pages/MainPage";
import Game from "./pages/Game";
import Profile from "./pages/Profile";

async function checkAuth() {
  const user = auth.currentUser;
  if (!user) {
    console.log("No logged in user");
    return;
  }
  const token = await user.getIdToken(/* forceRefresh? */ false);
  const res = await fetch("http://localhost:5000/test-auth", { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json(); console.log(json);
}

function App() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Logică Start din Home Page
  const handleStart = useCallback(() => {
    if (user) navigate("/dashboard");
    else navigate("/login");
  }, [navigate, user]);

  // Logică Salvare Scor - MUST BE BEFORE CONDITIONAL RETURN
  const handleGameOver = useCallback(async (score: number) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await addDoc(collection(db, "scores"), {
          uid: currentUser.uid,
          email: currentUser.email,
          score: score,
          game: "chicken_invaders",
          createdAt: serverTimestamp()
        });
        alert("Scor salvat!");
        navigate("/dashboard");
      } catch (e) {
        console.error(e);
      }
    } else {
      alert("Nu ești logat!");
      navigate("/login");
    }
  }, [navigate]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#00ff66', fontFamily: '"Press Start 2P", monospace' }}>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<HomePage onStart={handleStart} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route 
        path="/game/chicken" 
        element={
          <ProtectedRoute>
            <Game 
              onGameOver={handleGameOver} 
              onExit={() => navigate("/dashboard")} 
            />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
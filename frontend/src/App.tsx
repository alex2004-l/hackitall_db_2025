import { Routes, Route, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
// @ts-ignore
import { auth, db } from "./firebaseClient";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import ProtectedRoute from "./ProtectedRoute";

// import pages
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import MainPage from "./pages/MainPage";
import Chicken from "./pages/Chicken";
import Snake from "./pages/Snake";
import Profile from "./pages/Profile";
import Dino from "./pages/Dino"; 
import CrazyMode from "./pages/CrazyMode";
import Leaderboard from "./pages/Leaderboard";
import PublicProfile from "./pages/PublicProfile";

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

  const handleStart = useCallback(() => {
    if (user) navigate("/dashboard");
    else navigate("/login");
  }, [navigate, user]);

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
        alert("Score saved!");
        navigate("/dashboard");
      } catch (e) {
        console.error(e);
      }
    } else {
      alert("You are not logged in!");
      navigate("/login");
    }
  }, [navigate]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#00ff66', fontFamily: '"Press Start 2P", monospace' }}>Loading...</div>;
  
  const handleSnakeGameOver = async (score: number) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, "scores"), {
          uid: user.uid,
          email: user.email,
          score: score,
          game: "snake", 
          createdAt: serverTimestamp()
        });
        alert("Snake score saved!");
        navigate("/dashboard");
      } catch (e) {
        console.error(e);
      }
    } else {
      navigate("/login");
    }
  };
  
  const handleDinoGameOver = async (score: number) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, "scores"), {
          uid: user.uid,
          email: user.email,
          score: score,
          game: "dino", 
          createdAt: serverTimestamp()
        });
        alert("Dino score saved!");
        navigate("/dashboard");
      } catch (e) {
        console.error(e);
      }
    } else {
      navigate("/login");
    }
  };

  const handleCrazyModeEnd = async (finalScore: number, gameId: string) => {
    const user = auth.currentUser;
    if (user) {
        await addDoc(collection(db, "scores"), {
            uid: user.uid,
            email: user.email,
            score: finalScore,
            game: "crazymode", 
            lost_on: gameId, 
            createdAt: serverTimestamp()
        });
        alert(`Crazy Mode finished! Total Score: ${finalScore}`);
        navigate("/dashboard");
    } else {
        navigate("/login");
    }
  };

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
            <Chicken
              onGameOver={handleGameOver} 
              onExit={() => navigate("/dashboard")} 
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/game/snake" 
        element={
          <ProtectedRoute>
            <Snake
              onGameOver={handleSnakeGameOver}
              onExit={() => navigate("/dashboard")} 
            />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/game/dino" 
        element={
          <ProtectedRoute>
            <Dino 
              onGameOver={handleDinoGameOver}
              onExit={() => navigate("/dashboard")} 
            />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/crazy-mode" 
        element={
          <ProtectedRoute>
            <CrazyMode onModeEnd={handleCrazyModeEnd} />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/leaderboard" 
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/profile/:uid" 
        element={
          <ProtectedRoute>
            <PublicProfile />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
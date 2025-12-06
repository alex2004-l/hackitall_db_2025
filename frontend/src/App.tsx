import { Routes, Route, useNavigate } from "react-router-dom";
import { useCallback } from "react";
// @ts-ignore
import { auth, db } from "./firebaseClient";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Importăm paginile
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import MainPage from "./pages/MainPage";
import Game from "./pages/Game";

function App() {
  const navigate = useNavigate();

  // Logică Start din Home Page
  const handleStart = useCallback(() => {
    if (auth.currentUser) navigate("/dashboard");
    else navigate("/login");
  }, [navigate]);

  // Logică Salvare Scor
  const handleGameOver = async (score: number) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, "scores"), {
          uid: user.uid,
          email: user.email,
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
  };

  return (
    <Routes>
      <Route path="/" element={<HomePage onStart={handleStart} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<MainPage />} />
      <Route 
        path="/game/chicken" 
        element={
          <Game 
            onGameOver={handleGameOver} 
            onExit={() => navigate("/dashboard")} 
          />
        } 
      />
    </Routes>
  );
}

export default App;
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import { auth } from "./firebaseClient";
import { useCallback } from "react";

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

function App() {
  const navigate = useNavigate();

  const handleStart = useCallback(() => {
    if (auth.currentUser) navigate("/main");
    else navigate("/login");
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<HomePage onStart={handleStart} />} />
      <Route path="/login" element={<Login />} />
      {/* Need to add MainPage */}
      {/* <Route path="/main" element={<MainPage />} /> */}
    </Routes>
  );
}

export default AppWrapper;

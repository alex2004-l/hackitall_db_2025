import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseClient';
import { RetroBackground } from '../components/RetroBackground';
import { RetroCard, RetroButton, RetroTitle, NeonColors } from '../components/RetroUI';
import NavBar from '../components/NavBar';

const API_BASE_URL = "http://localhost:5000";

interface ProfileData {
  username: string;
  profilePictureUrl: string;
}

const MainPage = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [profile, setProfile] = useState<ProfileData>({ username: "", profilePictureUrl: "" });
  const [loading, setLoading] = useState(true);

  // Fetch profile from backend
  const fetchProfile = useCallback(async (currentUser: typeof auth.currentUser) => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Backend fetch failed.");
      const data: ProfileData = await response.json();
      setProfile(data);
    } catch (error) {
      console.error(`Loading profile failed: ${error}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch profile when component mounts
  useEffect(() => {
    if (user) {
      fetchProfile(user);
    } else {
      setLoading(false);
    }
  }, [user, fetchProfile]);

  // Common style for descriptive text
  const descriptionStyle = (color: string): React.CSSProperties => ({
    fontSize: '10px',
    lineHeight: '1.6',
    color: color,
    margin: '20px 0',
    textShadow: `0 0 5px ${color}`
  });

  return (
    <>
      <NavBar />
      <RetroBackground>
        <div style={{ padding: '40px', textAlign: 'center' }}>
        
        <RetroTitle size="32px">ARCADE DASHBOARD</RetroTitle>
        <p style={{ color: '#aaa', marginBottom: '40px', fontSize: '12px' }}>
          HELLO, {!loading && profile.username ? profile.username.toUpperCase() : 'ANONYMUS'}!
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px', maxWidth: '900px', margin: '0 auto' }}>
          
          {/* CARD 1: Chicken Invaders (Cyan) */}
          <RetroCard color={NeonColors.CYAN}>
            <RetroTitle size="18px" color={NeonColors.CYAN}>SPACE CHICKEN</RetroTitle>
            <div style={{ fontSize: '50px', margin: '20px' }}>🐔</div>
            
            <p style={descriptionStyle(NeonColors.CYAN)}>
              Defend Earth from an intergalactic chicken invasion in this classic shooter!
            </p>
            
            <RetroButton variant="cyan" onClick={() => navigate('/game/chicken')}>START GAME</RetroButton>
          </RetroCard>

          {/* CARD 2: Snake (Pink) */}
          <RetroCard color={NeonColors.PINK}>
            <RetroTitle size="18px" color={NeonColors.PINK}>NEON SNAKE</RetroTitle>
            <div style={{ fontSize: '50px', margin: '20px' }}>🐍</div>
            
            <p style={descriptionStyle(NeonColors.PINK)}>
              Eat neon apples and grow as long as possible without hitting walls.
            </p>
            
            <RetroButton variant="pink" onClick={() => navigate('/game/snake')}>START GAME</RetroButton>
          </RetroCard>

          {/* CARD 3: Dino Run (Yellow) */}
          <RetroCard color={NeonColors.YELLOW}>
            <RetroTitle size="18px" color={NeonColors.YELLOW}>RETRO DINO RUN</RetroTitle>
            <div style={{ fontSize: '50px', margin: '20px' }}>🦖</div>
            
            <p style={descriptionStyle(NeonColors.YELLOW)}>
              Jump over obstacles in this classic endless running game.
            </p>
            
            <RetroButton variant="yellow" onClick={() => navigate('/game/dino')}>START GAME</RetroButton>
          </RetroCard>

          {/* CARD 4: Crazy Mode (RED) - NEW */}
          <RetroCard color={NeonColors.RED}>
            <RetroTitle size="18px" color={NeonColors.RED}>CRAZY MODE</RetroTitle>
            <div style={{ fontSize: '50px', margin: '20px' }}>🔥</div>
            
            <p style={descriptionStyle(NeonColors.RED)}>
              Extreme mode: games change every 30 seconds!
            </p>
            
            <RetroButton variant="red" onClick={() => navigate('/crazy-mode')}>START CRAZY MODE</RetroButton>
          </RetroCard>

        </div>

      </div>
    </RetroBackground>
    </>
  );
};

export default MainPage;
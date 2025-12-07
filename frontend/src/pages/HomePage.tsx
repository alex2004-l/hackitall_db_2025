import { useEffect, useCallback } from "react";
import { RetroBackground } from "../components/RetroBackground";
import { RetroTitle, RetroButton, NeonColors } from "../components/RetroUI";

interface HomePageProps {
  onStart?: () => void;
}

const HomePage = ({ onStart }: HomePageProps) => {
  
  const handleStart = useCallback(() => {
    if (onStart) onStart();
  }, [onStart]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleStart]);

  return (
    <RetroBackground>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
        zIndex: 10
      }}>

        <div style={{ marginBottom: '20px' }}>
           <RetroTitle size="3.5rem" color={NeonColors.GREEN}>
             RETRO ARCADE
           </RetroTitle>
        </div>

        <p style={{
          color: NeonColors.GREEN,
          fontSize: '0.8rem',
          letterSpacing: '0.2rem',
          marginBottom: '50px',
          textShadow: `0 0 5px ${NeonColors.GREEN}`,
          opacity: 0.8
        }}>
          INSERT COIN • PRESS START
        </p>

        <div style={{ width: '300px' }}>
          <RetroButton 
            variant="green" 
            onClick={handleStart} 
            style={{ 
              fontSize: '1.2rem', 
              padding: '20px',
              animation: 'blink 1.5s infinite'
            }}
          >
            PRESS START
          </RetroButton>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '30px',
          right: '30px',
          textAlign: 'right',
          fontSize: '10px',
          color: NeonColors.YELLOW,
          textShadow: `0 0 5px ${NeonColors.YELLOW}`,
          lineHeight: '1.8'
        }}>
          <div>SCORE: 00000</div>
          <div>HIGH SCORE: 99999</div>
        </div>

      </div>

      <style>{`
        @keyframes blink { 
          0%, 100% { opacity: 1; } 
          50% { opacity: 0.5; } 
        }
      `}</style>

    </RetroBackground>
  );
};

export default HomePage;
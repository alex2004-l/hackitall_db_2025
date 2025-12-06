import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseClient';
import { RetroBackground } from '../components/RetroBackground';
// Importăm și NeonColors pentru a stiliza textul
import { RetroCard, RetroButton, RetroTitle, NeonColors } from '../components/RetroUI';

const MainPage = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // Stil comun pentru textele descriptive
  const descriptionStyle = (color: string): React.CSSProperties => ({
    fontSize: '10px',
    lineHeight: '1.6',
    color: color,
    margin: '20px 0',
    textShadow: `0 0 5px ${color}`
  });

  return (
    <RetroBackground>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        
        <RetroTitle size="32px">ARCADE DASHBOARD</RetroTitle>
        <p style={{ color: '#aaa', marginBottom: '40px', fontSize: '12px' }}>
          PLAYER: {user?.email || 'ANONIM'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px' }}>
          
          {/* Card Chicken Invaders */}
          <RetroCard color={NeonColors.CYAN}>
            <RetroTitle size="18px" color={NeonColors.CYAN}>SPACE CHICKEN</RetroTitle>
            <div style={{ fontSize: '50px', margin: '20px' }}>🐔</div>
            
            {/* --- TEXTUL A FOST REINTRODUS AICI --- */}
            <p style={descriptionStyle(NeonColors.CYAN)}>
              Apara pamantul de invazia gainilor intergalactice in acest shooter clasic!
            </p>
            
            <RetroButton variant="cyan" onClick={() => navigate('/game/chicken')}>START GAME</RetroButton>
          </RetroCard>

          {/* Card Snake */}
          <RetroCard color={NeonColors.PINK} style={{ opacity: 0.7 }}>
            <RetroTitle size="18px" color={NeonColors.PINK}>NEON SNAKE</RetroTitle>
            <div style={{ fontSize: '50px', margin: '20px' }}>🐍</div>
            
            {/* --- TEXTUL A FOST REINTRODUS AICI --- */}
            <p style={descriptionStyle(NeonColors.PINK)}>
              Mananca mere neon si creste cat mai mult fara sa te lovesti de ziduri.
            </p>
            
            <RetroButton variant="pink" disabled>LOCKED 🔒</RetroButton>
          </RetroCard>

        </div>

        <div style={{ marginTop: '50px' }}>
          <RetroButton variant="red" onClick={handleLogout} style={{ maxWidth: '200px' }}>DELOGARE</RetroButton>
        </div>

      </div>
    </RetroBackground>
  );
};

export default MainPage;
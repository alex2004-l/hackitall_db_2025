import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseClient';
import { RetroBackground } from '../components/RetroBackground';
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
          
          {/* CARD 1: Chicken Invaders (Cyan) */}
          <RetroCard color={NeonColors.CYAN}>
            <RetroTitle size="18px" color={NeonColors.CYAN}>SPACE CHICKEN</RetroTitle>
            <div style={{ fontSize: '50px', margin: '20px' }}>🐔</div>
            
            <p style={descriptionStyle(NeonColors.CYAN)}>
              Apara pamantul de invazia gainilor intergalactice in acest shooter clasic!
            </p>
            
            <RetroButton variant="cyan" onClick={() => navigate('/game/chicken')}>START GAME</RetroButton>
          </RetroCard>

          {/* CARD 2: Snake (Pink) */}
          <RetroCard color={NeonColors.PINK}>
            <RetroTitle size="18px" color={NeonColors.PINK}>NEON SNAKE</RetroTitle>
            <div style={{ fontSize: '50px', margin: '20px' }}>🐍</div>
            
            <p style={descriptionStyle(NeonColors.PINK)}>
              Mananca mere neon si creste cat mai mult fara sa te lovesti de ziduri.
            </p>
            
            <RetroButton variant="pink" onClick={() => navigate('/game/snake')}>START GAME</RetroButton>
          </RetroCard>

          {/* CARD 3: Dino Run (Yellow) */}
          <RetroCard color={NeonColors.YELLOW}>
            <RetroTitle size="18px" color={NeonColors.YELLOW}>NEON DINO RUN</RetroTitle>
            <div style={{ fontSize: '50px', margin: '20px' }}>🦖</div>
            
            <p style={descriptionStyle(NeonColors.YELLOW)}>
              Sari peste obstacole in acest joc clasic de alergare fara sfarsit.
            </p>
            
            <RetroButton variant="yellow" onClick={() => navigate('/game/dino')}>START GAME</RetroButton>
          </RetroCard>

          {/* CARD 4: Crazy Mode (RED) - NOU */}
          <RetroCard color={NeonColors.RED}>
            <RetroTitle size="18px" color={NeonColors.RED}>CRAZY MODE</RetroTitle>
            <div style={{ fontSize: '50px', margin: '20px' }}>🔥</div>
            
            <p style={descriptionStyle(NeonColors.RED)}>
              Modul extrem: jocurile se schimba la fiecare 30 de secunde!
            </p>
            
            <RetroButton variant="red" onClick={() => navigate('/crazy-mode')}>START CRAZY MODE</RetroButton>
          </RetroCard>

        </div>

        <div style={{ marginTop: '50px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <RetroButton variant="green" onClick={() => navigate('/profile')} style={{ maxWidth: '200px' }}>PROFILE</RetroButton>
          <RetroButton variant="red" onClick={handleLogout} style={{ maxWidth: '200px' }}>DELOGARE</RetroButton>
        </div>

      </div>
    </RetroBackground>
  );
};

export default MainPage;
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseClient';

const MainPage = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/'); // Te trimite înapoi la Home după delogare
  };

  return (
    <div style={{ textAlign: 'center', color: '#0ff', padding: '50px', fontFamily: '"Press Start 2P", cursive' }}>
      <h1>ARCADE DASHBOARD</h1>
      <p>Bine ai venit, {user?.email}!</p>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '50px' }}>
        {/* CARD JOC 1: Chicken Invaders */}
        <div style={{ border: '2px solid #0ff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 15px #0ff' }}>
          <h3>CHICKEN INVADERS</h3>
          <p>Apara pamantul de gaini!</p>
          <button 
            onClick={() => navigate('/game/chicken')}
            style={{ 
              padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit',
              background: '#0ff', color: '#000', border: 'none', marginTop: '10px' 
            }}
          >
            JOACĂ ACUM ▶
          </button>
        </div>

        {/* CARD JOC 2: (Viitor) */}
        <div style={{ border: '2px solid #f0f', padding: '20px', borderRadius: '10px', opacity: 0.5 }}>
          <h3>SNAKE RETRO</h3>
          <p>In curand...</p>
          <button disabled style={{ padding: '10px 20px', fontFamily: 'inherit' }}>LOCKED 🔒</button>
        </div>
      </div>

      <div style={{ marginTop: '50px' }}>
        <button onClick={handleLogout} style={{ background: 'red', color: 'white', border: 'none', padding: '10px', fontFamily: 'inherit', cursor: 'pointer' }}>
          DELOGARE
        </button>
      </div>
    </div>
  );
};

export default MainPage;
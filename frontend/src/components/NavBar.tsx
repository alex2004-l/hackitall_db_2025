import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseClient';
import { NeonColors } from './RetroUI';

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsGuest(user.isAnonymous);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '22px 45px',
    backgroundColor: '#020205',
    borderBottom: `4px solid ${NeonColors.CYAN}`,
    boxShadow: `0 0 12px ${NeonColors.CYAN}`,
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '15px',
  };

  const buttonStyle = (color: string): React.CSSProperties => ({
    padding: '12px 22px',
    marginLeft: '22px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: `3px solid ${color}`,
    color: color,
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '12px',
    boxShadow: `0 0 10px ${color}`,
    transition: 'all 0.3s ease',
  });

  return (
    <nav style={navStyle}>
      <div
        onClick={() => navigate('/dashboard')}
        style={{
          ...buttonStyle(NeonColors.GREEN),
          cursor: 'pointer',
          marginLeft: 0,
        }}
      >
        🎮 DASHBOARD
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {!isGuest && (
          <div
            onClick={() => navigate('/profile')}
            style={buttonStyle(NeonColors.PINK)}
          >
            👤 PROFILE
          </div>
        )}

        <div
          onClick={() => navigate('/leaderboard')}
          style={buttonStyle(NeonColors.YELLOW)}
        >
          🏆 LEADERBOARD
        </div>

        <div
          onClick={handleLogout}
          style={buttonStyle(NeonColors.RED)}
        >
          🚪 LOGOUT
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

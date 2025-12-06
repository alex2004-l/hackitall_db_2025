import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseClient';
import { NeonColors } from './RetroUI';

const NavBar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 30px',
    backgroundColor: '#020205',
    borderBottom: `3px solid ${NeonColors.CYAN}`,
    boxShadow: `0 0 10px ${NeonColors.CYAN}`,
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '10px',
  };

  const buttonStyle = (color: string): React.CSSProperties => ({
    padding: '8px 15px',
    marginLeft: '15px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: `2px solid ${color}`,
    color: color,
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '10px',
    boxShadow: `0 0 8px ${color}`,
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
        <div
          onClick={() => navigate('/profile')}
          style={buttonStyle(NeonColors.PINK)}
        >
          👤 PROFILE
        </div>

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

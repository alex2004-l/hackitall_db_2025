// src/components/RetroUI.tsx
import { type ReactNode, type CSSProperties, type ButtonHTMLAttributes } from 'react';

// --- CULORI NEON STANDARD ---
export const NeonColors = {
  CYAN: '#0ff',
  PINK: '#f0f',
  YELLOW: '#ff0',
  RED: '#f00',
  GREEN: '#0f0'
};

// --- STILURI CSS INJECTATE PENTRU HOVER ---
const retroGlobalStyles = `
  .retro-btn { transition: all 0.2s ease-in-out; }
  .retro-btn:hover:not(:disabled) { transform: scale(1.05); }
  .retro-btn:active:not(:disabled) { transform: scale(0.95); }
  
  .glow-cyan:hover:not(:disabled) { background: ${NeonColors.CYAN}; color: #000; box-shadow: 0 0 20px ${NeonColors.CYAN}; }
  .glow-pink:hover:not(:disabled) { background: ${NeonColors.PINK}; color: #000; box-shadow: 0 0 20px ${NeonColors.PINK}; }
  .glow-red:hover:not(:disabled) { background: ${NeonColors.RED}; color: #fff; box-shadow: 0 0 20px ${NeonColors.RED}; }
  .glow-yellow:hover:not(:disabled) { background: ${NeonColors.YELLOW}; color: #000; box-shadow: 0 0 20px ${NeonColors.YELLOW}; }
  .glow-green:hover:not(:disabled) { background: ${NeonColors.GREEN}; color: #000; box-shadow: 0 0 20px ${NeonColors.GREEN}; }`
;

// Injectăm stilul doar o dată
if (typeof document !== 'undefined' && !document.getElementById('retro-ui-styles')) {
  const style = document.createElement('style');
  style.id = 'retro-ui-styles';
  style.innerHTML = retroGlobalStyles;
  document.head.appendChild(style);
}

// --- 1. RETRO CONTAINER (Fundal Pagina) ---
export const RetroContainer = ({ children }: { children: ReactNode }) => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: '#020205',
    backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.03) 0px, rgba(0, 255, 255, 0.03) 1px, transparent 1px, transparent 4px)',
    color: NeonColors.CYAN,
    fontFamily: '"Press Start 2P", cursive',
    padding: '40px',
    textAlign: 'center',
    boxSizing: 'border-box'
  }}>
    {children}
  </div>
);

// --- 2. RETRO CARD (Cutiile jocurilor) ---
interface CardProps {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}
export const RetroCard = ({ children, color = NeonColors.CYAN, style }: CardProps) => (
  <div style={{
    border: `3px solid ${color}`,
    padding: '20px',
    borderRadius: '15px',
    boxShadow: `0 0 15px ${color}, inset 0 0 10px ${color}33`,
    backgroundColor: 'rgba(0, 10, 20, 0.8)',
    maxWidth: '350px',
    margin: '10px',
    ...style
  }}>
    {children}
  </div>
);

// --- 3. RETRO BUTTON (Butoanele) ---
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cyan' | 'pink' | 'red' | 'yellow' | 'green';
}
export const RetroButton = ({ children, variant = 'cyan', style, disabled, ...props }: ButtonProps) => {
  const colorMap = {
    cyan: NeonColors.CYAN,
    pink: NeonColors.PINK,
    red: NeonColors.RED,
    yellow: NeonColors.YELLOW,
    green: NeonColors.GREEN
  };
  const color = colorMap[variant];

  return (
    <button
      className={`retro-btn glow-${variant}`}
      disabled={disabled}
      style={{
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '12px',
        padding: '12px 24px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: 'transparent',
        color: color,
        border: `2px solid ${color}`,
        boxShadow: disabled ? 'none' : `0 0 5px ${color}`,
        opacity: disabled ? 0.5 : 1,
        marginTop: '15px',
        width: '100%',
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
};

// --- 4. RETRO TEXT (Titluri strălucitoare) ---
export const RetroTitle = ({ children, color = NeonColors.CYAN, size = '24px' }: { children: ReactNode, color?: string, size?: string }) => (
  <h1 style={{
    color: color,
    textShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
    fontSize: size,
    marginBottom: '20px',
    marginTop: 0
  }}>
    {children}
  </h1>
);
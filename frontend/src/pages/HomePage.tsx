// src/pages/HomePage.tsx
import { useEffect, useCallback} from "react";

interface HomePageProps {
  onStart?: () => void;
}

// Pixel art SVG data URIs (neon variants)
const pixelCoin = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%2300ff66' width='32' height='32'/%3E%3Crect fill='%23ff33cc' x='4' y='4' width='24' height='24'/%3E%3Crect fill='%2300ff66' x='8' y='8' width='16' height='16'/%3E%3C/svg%3E`;
const pixelGhost = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23ff33cc' width='32' height='32'/%3E%3Crect fill='%2300ff66' x='4' y='4' width='24' height='20'/%3E%3Crect fill='%23ff33cc' x='8' y='8' width='4' height='4'/%3E%3Crect fill='%23ff33cc' x='20' y='8' width='4' height='4'/%3E%3Crect fill='%23000' x='9' y='9' width='2' height='2'/%3E%3Crect fill='%23000' x='21' y='9' width='2' height='2'/%3E%3C/svg%3E`;
const pixelStar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23ff33cc' x='12' y='0' width='8' height='8'/%3E%3Crect fill='%2300ff66' x='20' y='12' width='8' height='8'/%3E%3Crect fill='%23ff33cc' x='12' y='24' width='8' height='8'/%3E%3Crect fill='%2300ff66' x='0' y='12' width='8' height='8'/%3E%3Crect fill='%23ffff00' x='12' y='12' width='8' height='8'/%3E%3C/svg%3E`;
const pixelHeart = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23ff33cc' width='32' height='32'/%3E%3Crect fill='%2300ff66' x='8' y='8' width='16' height='16'/%3E%3C/svg%3E`;

const floatingSprites = [
  pixelCoin, pixelCoin, pixelGhost, pixelStar, pixelStar, pixelHeart, pixelGhost, pixelHeart, pixelGhost, pixelCoin
];

const HomePage: React.FC<HomePageProps> = ({ onStart }) => {
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
  <div style={styles.container}>
    <div style={styles.scanlines} aria-hidden />

    {/* Floating sprites in the background */}
    {floatingSprites.map((sprite, i) => {
      const top = `${Math.random() * 90}%`;   // anywhere on the screen
      const left = `${Math.random() * 95}%`;
      const duration = 1.2 + Math.random();   // 1.2 - 2.2s
      const delay = Math.random() * 0.5;
      return (
        <img
          key={i}
          src={sprite}
          style={{
            ...styles.pixelDecoration,
            top,
            left,
            animation: `bounce ${duration}s infinite ${delay}s`,
          }}
          alt="sprite"
        />
      );
    })}

    {/* Centered content wrapper */}
    <div style={styles.contentWrapper}>
      <h1 style={styles.title}>RETRO ARCADE</h1>
      <p style={styles.subtitle}>INSERT COIN • PRESS START</p>

      <button style={styles.startPrompt} onClick={handleStart} aria-label="Start game">
        <span style={styles.blink}>PRESS START</span>
      </button>
    </div>

    {/* Score display */}
    <div style={styles.scoreDisplay}>
      <div>SCORE: 0</div>
      <div>HIGH SCORE: 99999</div>
    </div>
  </div>
  );
};

export default HomePage;

const neonGreen = "#00ff66";
const neonPink = "#ff33cc";

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100%",
    fontFamily: '"Press Start 2P", monospace',
    background: "radial-gradient(ellipse at center, #050505 0%, #000 100%)",
    color: neonGreen,
    overflow: "hidden",
  },
  contentWrapper: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
    textAlign: "center",
  },
  scanlines: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    backgroundImage:
      "repeating-linear-gradient(rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)",
    opacity: 0.6,
    zIndex: 0,
  },
  title: {
    fontSize: "3.5rem",
    letterSpacing: "0.4rem",
    margin: 0,
    padding: 0,
    textAlign: "center",
    textShadow: `0 0 10px ${neonGreen}, 0 0 20px ${neonPink}`,
    zIndex: 3,
  },
  subtitle: {
    marginTop: "0.5rem",
    marginBottom: "2.5rem",
    color: neonGreen,
    opacity: 0.85,
    zIndex: 3,
    fontSize: "0.8rem",
    letterSpacing: "0.2rem",
  },
  startPrompt: {
    background: "transparent",
    border: `3px solid ${neonGreen}`,
    padding: "1.2rem 2rem",
    cursor: "pointer",
    color: neonGreen,
    zIndex: 3,
    boxShadow: `0 0 16px ${neonGreen}`,
    transition: "transform 0.12s ease, box-shadow 0.12s ease",
    fontSize: "0.9rem",
    fontFamily: '"Press Start 2P", monospace',
  },
  blink: {
    display: "inline-block",
    animation: "blink 1s steps(1, start) infinite",
  },
  pixelDecoration: {
    position: "absolute",
    width: 40,
    height: 40,
    imageRendering: "pixelated",
    zIndex: 1,
    filter: `drop-shadow(0 0 6px ${neonGreen}) drop-shadow(0 0 6px ${neonPink})`,
  },
  scoreDisplay: {
    position: "absolute",
    bottom: "2rem",
    right: "2rem",
    textAlign: "right",
    fontSize: "0.7rem",
    color: neonGreen,
    zIndex: 3,
    lineHeight: 1.8,
    opacity: 0.9,
  },
  
};

// Inject keyframes dynamically
const styleSheet = `
@keyframes blink { 50% { opacity: 0 } }
@keyframes bounce { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(3deg); } }
button:active { transform: scale(0.98) }
button:hover { box-shadow: 0 0 24px ${neonGreen}, 0 0 24px ${neonPink} }
@keyframes scanlineMove { 0% { background-position: 0 0; } 100% { background-position: 0 100px; } }
`;

if (typeof window !== "undefined") {
  const id = "retro-homepage-styles";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.appendChild(document.createTextNode(styleSheet));
    document.head.appendChild(s);
  }
}

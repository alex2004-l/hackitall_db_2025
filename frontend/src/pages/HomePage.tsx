// src/pages/HomePage.tsx — Full Retro Arcade Start Screen
import React, { useEffect, useCallback } from "react";

interface HomePageProps {
  onStart?: () => void;
}

// Pixel art SVG data URIs (no external files needed)
const pixelCoin = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23FFD700' width='32' height='32'/%3E%3Crect fill='%23FFA500' x='4' y='4' width='24' height='24'/%3E%3Crect fill='%23FFD700' x='8' y='8' width='16' height='16'/%3E%3C/svg%3E`;
const pixelGhost = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23FF69B4' width='32' height='32'/%3E%3Crect fill='%23FF1493' x='4' y='4' width='24' height='20'/%3E%3Crect fill='%23FFB6C1' x='8' y='8' width='4' height='4'/%3E%3Crect fill='%23FFB6C1' x='20' y='8' width='4' height='4'/%3E%3Crect fill='%23000' x='9' y='9' width='2' height='2'/%3E%3Crect fill='%23000' x='21' y='9' width='2' height='2'/%3E%3C/svg%3E`;
const pixelStar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23FFFF00' x='12' y='0' width='8' height='8'/%3E%3Crect fill='%23FFFF00' x='20' y='12' width='8' height='8'/%3E%3Crect fill='%23FFFF00' x='12' y='24' width='8' height='8'/%3E%3Crect fill='%23FFFF00' x='0' y='12' width='8' height='8'/%3E%3Crect fill='%23FFD700' x='12' y='12' width='8' height='8'/%3E%3C/svg%3E`;

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
      
      {/* Pixel Decorations - Coins, Ghosts, Stars */}
      <img src={pixelCoin} style={{ ...styles.pixelDecoration, top: "15%", left: "12%" }} alt="coin" />
      <img src={pixelCoin} style={{ ...styles.pixelDecoration, top: "70%", left: "80%", animation: "bounce 1.5s infinite" }} alt="coin" />
      <img src={pixelGhost} style={{ ...styles.pixelDecoration, top: "25%", left: "85%", animation: "bounce 1.8s infinite 0.2s" }} alt="ghost" />
      <img src={pixelStar} style={{ ...styles.pixelDecoration, top: "65%", left: "8%", animation: "bounce 1.3s infinite 0.1s" }} alt="star" />
      <img src={pixelStar} style={{ ...styles.pixelDecoration, top: "35%", left: "5%", animation: "bounce 1.6s infinite 0.3s" }} alt="star" />

      {/* Centered Content */}
      <div style={styles.contentWrapper}>
        {/* Title */}
        <h1 style={styles.title}>RETRO ARCADE</h1>
        <p style={styles.subtitle}>INSERT COIN • PRESS START</p>

        {/* Start Button */}
        <button style={styles.startPrompt} onClick={handleStart} aria-label="Start game">
          <span style={styles.blink}>PRESS START</span>
        </button>
      </div>

      {/* Score Display */}
      <div style={styles.scoreDisplay}>
        <div>SCORE: 0</div>
        <div>HIGH SCORE: 99999</div>
      </div>
    </div>
  );
};

export default HomePage;

const neon = "#00ff66";
const accent = "#ff33cc";

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
    color: neon,
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
    textShadow: `0 0 10px ${neon}, 0 0 20px ${accent}`,
    zIndex: 3,
  },
  subtitle: {
    marginTop: "0.5rem",
    marginBottom: "2.5rem",
    color: neon,
    opacity: 0.85,
    zIndex: 3,
    fontSize: "0.8rem",
    letterSpacing: "0.2rem",
  },
  startPrompt: {
    background: "transparent",
    border: `3px solid ${neon}`,
    padding: "1.2rem 2rem",
    cursor: "pointer",
    color: neon,
    zIndex: 3,
    boxShadow: `0 0 16px ${neon}`,
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
    filter: "drop-shadow(0 0 4px currentColor)",
  },
  scoreDisplay: {
    position: "absolute",
    bottom: "2rem",
    right: "2rem",
    textAlign: "right",
    fontSize: "0.7rem",
    color: neon,
    zIndex: 3,
    lineHeight: 1.8,
    opacity: 0.9,
  },
};

// Add keyframe styles via injected stylesheet
const styleSheet = `
@keyframes blink { 50% { opacity: 0 } }
@keyframes bounce { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(3deg); } }
button:active { transform: scale(0.98) }
button:hover { box-shadow: 0 0 24px ${neon} }
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

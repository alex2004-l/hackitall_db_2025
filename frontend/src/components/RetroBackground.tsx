// src/components/RetroBackground.tsx
import { useEffect, useMemo, type ReactNode } from 'react';

// --- 1. DEFINIȚII SVG (Pixel Art - Variante mai luminoase) ---
// Am mărit puțin strălucirea culorilor din SVG-uri
const pixelCoin = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%2300ff88' width='32' height='32'/%3E%3Crect fill='%23ff55dd' x='4' y='4' width='24' height='24'/%3E%3Crect fill='%2300ff88' x='8' y='8' width='16' height='16'/%3E%3C/svg%3E`;
const pixelGhost = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23ff55dd' width='32' height='32'/%3E%3Crect fill='%2300ff88' x='4' y='4' width='24' height='20'/%3E%3Crect fill='%23ff55dd' x='8' y='8' width='4' height='4'/%3E%3Crect fill='%23ff55dd' x='20' y='8' width='4' height='4'/%3E%3Crect fill='%23000' x='9' y='9' width='2' height='2'/%3E%3Crect fill='%23000' x='21' y='9' width='2' height='2'/%3E%3C/svg%3E`;
const pixelStar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23ff55dd' x='12' y='0' width='8' height='8'/%3E%3Crect fill='%2300ff88' x='20' y='12' width='8' height='8'/%3E%3Crect fill='%23ff55dd' x='12' y='24' width='8' height='8'/%3E%3Crect fill='%2300ff88' x='0' y='12' width='8' height='8'/%3E%3Crect fill='%23ffff22' x='12' y='12' width='8' height='8'/%3E%3C/svg%3E`;
const pixelHeart = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23ff55dd' width='32' height='32'/%3E%3Crect fill='%2300ff88' x='8' y='8' width='16' height='16'/%3E%3C/svg%3E`;

// Lista sursă din care vom alege aleatoriu
const sourceSprites = [pixelCoin, pixelGhost, pixelStar, pixelHeart];

// --- 2. ANIMATII CSS GLOBALE ---
const globalStyles = `
@keyframes retroBounce { 
  0%, 100% { transform: translateY(0) rotate(0deg); } 
  50% { transform: translateY(-25px) rotate(15deg); } 
}
`;

export const RetroBackground = ({ children }: { children: ReactNode }) => {
  
  useEffect(() => {
    if (!document.getElementById('retro-bg-anim')) {
      const style = document.createElement('style');
      style.id = 'retro-bg-anim';
      style.innerHTML = globalStyles;
      document.head.appendChild(style);
    }
  }, []);

  // --- MODIFICARE PRINCIPALĂ: Generăm 35 de obiecte ---
  const floatingItems = useMemo(() => {
    const ITEM_COUNT = 35; // Număr mult mai mare de obiecte
    
    return Array.from({ length: ITEM_COUNT }).map((_, i) => {
      // Alegem o imagine random din listă
      const randomSprite = sourceSprites[Math.floor(Math.random() * sourceSprites.length)];
      
      return {
        id: i,
        src: randomSprite,
        // Răspândire pe tot ecranul
        top: `${Math.random() * 100}%`,      
        left: `${Math.random() * 100}%`,     
        // Animații mai variate și mai lente pentru un efect atmosferic
        duration: `${4 + Math.random() * 5}s`, 
        // Delay negativ pentru ca ele să fie deja în mișcare la încărcare
        delay: `-${Math.random() * 5}s`,
        // Mărime variabilă pentru adâncime
        size: `${30 + Math.random() * 20}px`
      };
    });
  }, []);

  return (
    <div style={{
      position: "relative",
      minHeight: "100vh",
      width: "100%",
      backgroundColor: "#020205",
      // MODIFICARE: Gradient central mai luminos (#222 în loc de #111)
      backgroundImage: "radial-gradient(ellipse at center, #222 0%, #000 100%)",
      overflow: "hidden",
      fontFamily: '"Press Start 2P", monospace',
    }}>
      
      {/* 1. LAYER SCANLINES - Puțin mai vizibile */}
      <div style={{
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(ellipse at center, #0a0a0a 0%, #000 100%)",
        backgroundSize: "100% 4px",
        zIndex: 1,
        opacity: 0.8
      }} />

      {/* 2. LAYER SPRITES (Acum sunt 35 și mai luminoase) */}
      {floatingItems.map((item) => (
        <img
          key={item.id}
          src={item.src}
          alt="deco"
          style={{
            position: "absolute",
            width: item.size,
            height: item.size,
            imageRendering: "pixelated",
            zIndex: 2,
            top: item.top,
            left: item.left,
            animation: `retroBounce ${item.duration} infinite ease-in-out ${item.delay}`,
            // MODIFICARE: Opacitate mai mare (0.85 vs 0.6) pentru luminozitate
            opacity: 0.85, 
            // Adăugăm un mic glow CSS
            filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.3))',
            pointerEvents: "none"
          }}
        />
      ))}

      {/* 3. LAYER CONȚINUT */}
      <div style={{ position: "relative", zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
};
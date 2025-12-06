import { useEffect, useRef, useState } from 'react';
import { RetroBackground } from '../components/RetroBackground';

// --- 1. IMPORT FONT RETRO ---
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
fontLink.rel = 'stylesheet';
if (!document.head.querySelector(`link[href="${fontLink.href}"]`)) {
    document.head.appendChild(fontLink);
}

// --- 2. DEFINIȚIE SPRITE GĂINĂ (Pixel Art) ---
const pixelChicken = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23ffffff' x='6' y='6' width='20' height='20'/%3E%3Crect fill='%23ff0000' x='12' y='2' width='8' height='4'/%3E%3Crect fill='%23ffcc00' x='12' y='14' width='8' height='4'/%3E%3Crect fill='%23000000' x='10' y='10' width='4' height='4'/%3E%3Crect fill='%23000000' x='18' y='10' width='4' height='4'/%3E%3Crect fill='%23dddddd' x='2' y='10' width='4' height='8'/%3E%3Crect fill='%23dddddd' x='26' y='10' width='4' height='8'/%3E%3Crect fill='%23ff0000' x='13' y='26' width='2' height='4'/%3E%3Crect fill='%23ff0000' x='17' y='26' width='2' height='4'/%3E%3C/svg%3E`;

// --- TIPURI PENTRU CRAZY MODE ---
type ScoreRef = {
  current: number;
};

type GameProps = {
  onGameOver: (score: number) => void;
  onExit: () => void;
  scoreRef?: ScoreRef; // Ref-ul de scor din Crazy Mode (opțional)
  onScoreUpdate?: () => void; // Callback pentru actualizarea scorului total
};

// MODIFICARE: Destructurăm prop-urile, redenumind scoreRef la externalScoreRef
const Game = ({ onGameOver, onExit, scoreRef: externalScoreRef, onScoreUpdate }: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Stare logică (rapidă)
  const livesRef = useRef(3);
  const localScoreRef = useRef(0); // [1] Ref-ul intern de scor (fallback)
  const gameRunningRef = useRef(true);
  
  // [2] Determinăm ce Ref vom folosi: cel extern (Crazy Mode) sau cel intern
  const activeScoreRef = externalScoreRef || localScoreRef;

  // Stare UI (lentă)
  const [uiLives, setUiLives] = useState(3);
  const [uiScore, setUiScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Configurări
  const playerSpeed = 7;
  const bulletSpeed = 9;
  const enemySpeed = 3;
  const spawnRate = 45;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Culori Neon
  const NEON_CYAN = '#0ff';
  const NEON_PINK = '#f0f';
  const NEON_YELLOW = '#ff0';
  const NEON_RED = '#f00';
  const BG_COLOR = '#050510'; 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setăm pixelare clară (fără blur la mărire)
    ctx.imageSmoothingEnabled = false;

    // --- PRE-ÎNCĂRCARE IMAGINE GĂINĂ ---
    const chickenImg = new Image();
    chickenImg.src = pixelChicken;

    // Reset valori
    livesRef.current = 3;
    gameRunningRef.current = true;
    setUiLives(3);
    
    // [3] Resetăm scorul DOAR dacă suntem în modul normal
    if (!externalScoreRef) { 
        activeScoreRef.current = 0;
    }
    setUiScore(activeScoreRef.current);

    let animationId: number;
    let frameCount = 0;
    let lastHitTime = 0;

    const player = { 
      x: CANVAS_WIDTH / 2 - 25, y: CANVAS_HEIGHT - 70, width: 50, height: 50, color: NEON_CYAN
    };
    
    let bullets: { x: number, y: number, width: number, height: number, color: string }[] = [];
    let enemies: { x: number, y: number, width: number, height: number, color: string }[] = [];
    
    const keys: { [key: string]: boolean } = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const loseLife = () => {
      if (Date.now() - lastHitTime < 1000) return;
      livesRef.current -= 1;
      setUiLives(livesRef.current);
      lastHitTime = Date.now();

      // Flash roșu pe container
      if (canvas.parentElement) {
          canvas.parentElement.style.boxShadow = `0 0 50px ${NEON_RED}, inset 0 0 50px ${NEON_RED}`;
          setTimeout(() => { 
              // Restaurăm bordura Neon Cyan
              if (canvas.parentElement) canvas.parentElement.style.boxShadow = `0 0 40px ${NEON_CYAN}, inset 0 0 20px ${NEON_CYAN}`; 
          }, 300);
      }

      if (livesRef.current <= 0) {
        endGame();
      }
    };

    // MODIFICARE: Folosim activeScoreRef
    const endGame = () => {
      gameRunningRef.current = false;
      setIsGameOver(true);
      // Trimitem scorul din Ref-ul activ
      onGameOver(activeScoreRef.current); 
    };

    // Funcție pentru dreptunghiuri strălucitoare (Player & Gloanțe)
    const drawGlowingRect = (x: number, y: number, w: number, h: number, color: string, blur: number = 20) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
    };

    // --- BUCLA PRINCIPALĂ ---
    const loop = () => {
      if (!gameRunningRef.current) return;

      // 1. Curățare Ecran
      ctx.fillStyle = BG_COLOR; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- 1b. DESENARE GRILĂ RETRO ---
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const gridSpacing = 60;
      const gridOffset = (frameCount * 3) % gridSpacing;

      for (let i = -1; i < CANVAS_HEIGHT / gridSpacing + 1; i++) {
          const y = i * gridSpacing + gridOffset;
          ctx.moveTo(0, y);
          ctx.lineTo(CANVAS_WIDTH, y);
      }
      for (let i = 0; i <= CANVAS_WIDTH; i += gridSpacing) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i, CANVAS_HEIGHT);
      }
      ctx.stroke();
      ctx.restore();
      // --------------------------------

      // 2. Mișcare Jucător
      if (keys['ArrowLeft'] && player.x > 0) player.x -= playerSpeed;
      if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += playerSpeed;

      // --- DESENARE JUCĂTOR ---
      let playerColor = player.color;
      let blurAmount = 25;

      if (Date.now() - lastHitTime < 1000 && Math.floor(Date.now() / 100) % 2 === 0) {
        playerColor = '#aaa'; // Invincibil
        blurAmount = 10;
      }
      drawGlowingRect(player.x, player.y, player.width, player.height, playerColor, blurAmount);
      
      // Tragere
      if (keys['Space'] && frameCount % 10 === 0) {
        bullets.push({ x: player.x + 20, y: player.y, width: 10, height: 25, color: NEON_YELLOW });
      }

      // 3. Logică Gloanțe
      bullets.forEach((b, i) => {
        b.y -= bulletSpeed;
        drawGlowingRect(b.x, b.y, b.width, b.height, b.color, 15);
        if (b.y < 0) bullets.splice(i, 1);
      });

      // 4. Generare Inamici (Găini)
      if (frameCount % spawnRate === 0) {
        const xPos = Math.random() * (canvas.width - 40);
        // Dimensiune găină: 45x45 px
        enemies.push({ x: xPos, y: -45, width: 45, height: 45, color: NEON_RED });
      }

      // 5. Logică Inamici
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemySpeed;
        
        // --- DESENARE GĂINĂ ---
        ctx.save();
        ctx.shadowColor = '#f00'; 
        ctx.shadowBlur = 15;
        if (chickenImg.complete) {
            ctx.drawImage(chickenImg, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            // Fallback dacă imaginea nu s-a încărcat încă
            ctx.fillStyle = 'red';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
        ctx.restore();
        // -----------------------

        // Coliziuni
        if (enemy.y > canvas.height) { enemies.splice(i, 1); loseLife(); continue; }
        if (
          player.x < enemy.x + enemy.width && player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height && player.height + player.y > enemy.y
        ) { enemies.splice(i, 1); loseLife(); continue; }

        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          if (
            b.x < enemy.x + enemy.width && b.x + b.width > enemy.x &&
            b.y < enemy.y + enemy.height && b.height + b.y > enemy.y
          ) {
            enemies.splice(i, 1);
            bullets.splice(j, 1);
            
            // [4] MODIFICARE: Folosim activeScoreRef și notificăm părintele
            activeScoreRef.current += 50; 
            setUiScore(activeScoreRef.current);
            if (onScoreUpdate) { 
                onScoreUpdate(); // Notifică CrazyMode să actualizeze scorul total
            }
            break;
          }
        }
      }

      frameCount++;
      animationId = requestAnimationFrame(loop);
    };

    // Așteptăm puțin să se încarce imaginea, deși DataURI e instant
    animationId = requestAnimationFrame(loop);

    return () => {
      gameRunningRef.current = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, [activeScoreRef, onScoreUpdate]); // Adăugăm dependențe pentru useCallback (onScoreUpdate)

  // --- Stiluri UI ---
  const containerStyle: React.CSSProperties = { 
      textAlign: 'center', 
      color: NEON_CYAN, 
      padding: '20px', 
      fontFamily: '"Press Start 2P", cursive',
  };

  const textGlow = (color: string) => `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}`;
  
  const uiBarStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: `${CANVAS_WIDTH}px`, margin: '0 auto 25px auto',
    backgroundColor: 'rgba(0, 20, 40, 0.8)', padding: '15px 25px',
    border: `3px solid ${NEON_CYAN}`, 
    boxShadow: `0 0 25px ${NEON_CYAN}, inset 0 0 10px ${NEON_CYAN}`,
    borderRadius: '10px',
    boxSizing: 'border-box'
  };

  const buttonStyle = (color: string): React.CSSProperties => ({
    cursor: 'pointer', fontWeight: 'bold', padding: '12px 24px',
    fontFamily: '"Press Start 2P", cursive', fontSize: '12px',
    backgroundColor: 'rgba(0,0,0,0.5)', color: color, 
    border: `2px solid ${color}`,
    boxShadow: `0 0 15px ${color}`,
    textShadow: `0 0 5px ${color}`,
    transition: 'all 0.2s ease-in-out'
  });

  const crtOverlayStyle: React.CSSProperties = {
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none',
      backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
      backgroundSize: '100% 4px',
      boxShadow: 'inset 0 0 100px rgba(0,0,0,0.7)',
      zIndex: 10
  };

  return (
    <RetroBackground>
      <div style={containerStyle}>
        
        {/* Bara UI */}
        <div style={uiBarStyle}>
          <h3 style={{ margin: 0, fontSize: '16px', textShadow: textGlow(NEON_CYAN) }}>SCORE: {uiScore}</h3>
          <div style={{ fontSize: '20px', color: NEON_PINK, textShadow: textGlow(NEON_PINK) }}>
            LIVES: {Array.from({ length: Math.max(0, uiLives) }).map((_, i) => <span key={i} style={{ marginLeft: '8px' }}>❤️</span>)}
          </div>
          <button onClick={onExit} style={buttonStyle(NEON_CYAN)}>EXIT</button>
        </div>
        
        {/* Container pentru Canvas și Efecte CRT */}
        <div style={{ 
            position: 'relative', 
            display: 'inline-block', 
            width: `${CANVAS_WIDTH}px`, 
            height: `${CANVAS_HEIGHT}px`,
            border: `4px solid ${NEON_CYAN}`,
            boxShadow: `0 0 40px ${NEON_CYAN}, inset 0 0 20px ${NEON_CYAN}`,
            borderRadius: '4px',
            overflow: 'hidden'
        }}>
          <canvas 
            ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} 
            style={{ display: 'block', backgroundColor: BG_COLOR }}
          />

          <div style={crtOverlayStyle}></div>
          
          {isGameOver && (
            <div style={{
              position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
              backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              border: `5px solid ${NEON_RED}`, 
              boxShadow: `inset 0 0 100px ${NEON_RED}, 0 0 50px ${NEON_RED}`,
              zIndex: 20
            }}>
              <h1 style={{ color: NEON_RED, fontSize: '45px', margin: '0 0 30px 0', textShadow: textGlow(NEON_RED) }}>GAME OVER</h1>
              <p style={{ fontSize: '22px', color: '#fff', margin: '0 0 40px 0', textShadow: textGlow('#fff') }}>Final Score: {uiScore}</p>
              <button onClick={() => onGameOver(activeScoreRef.current)} style={{...buttonStyle(NEON_YELLOW), fontSize: '16px', padding: '15px 30px', backgroundColor: 'rgba(255, 255, 0, 0.2)'}}>
                💾 SALVEAZĂ SCOR
              </button>
            </div>
          )}
        </div>
        <p style={{ color: '#aaa', marginTop: '25px', fontSize: '12px', textShadow: '0 0 5px #fff', opacity: 0.7 }}>
          ⬅️ ➡️ Mișcare | SPACE Tragere
        </p>
      </div>
    </RetroBackground>
  );
};

export default Game;
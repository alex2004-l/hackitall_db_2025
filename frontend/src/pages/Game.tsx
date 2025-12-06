import { useEffect, useRef, useState } from 'react';

// --- 1. IMPORT FONT RETRO ---
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
fontLink.rel = 'stylesheet';
// Verificăm dacă există deja pentru a nu-l adăuga de mai multe ori
if (!document.head.querySelector(`link[href="${fontLink.href}"]`)) {
    document.head.appendChild(fontLink);
}

type GameProps = {
  onGameOver: (score: number) => void;
  onExit: () => void;
};

const Game = ({ onGameOver, onExit }: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Stare logică (rapidă)
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const gameRunningRef = useRef(true);

  // Stare UI (lentă)
  const [uiLives, setUiLives] = useState(3);
  const [uiScore, setUiScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Configurări
  const playerSpeed = 7;
  const bulletSpeed = 9; // Puțin mai rapid
  const enemySpeed = 3; // Puțin mai rapid
  const spawnRate = 45; // Apar mai des
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Culori Neon Fosforescente
  const NEON_CYAN = '#0ff';
  const NEON_PINK = '#f0f';
  const NEON_YELLOW = '#ff0';
  const NEON_RED = '#f00';
  const BG_COLOR = '#050510'; // Negru ușor albăstrui pentru contrast

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset
    livesRef.current = 3;
    scoreRef.current = 0;
    gameRunningRef.current = true;
    setUiLives(3);
    setUiScore(0);

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

      // Flash roșu neon intens la lovitură pe containerul canvas
      if (canvas.parentElement) {
          canvas.parentElement.style.boxShadow = `0 0 50px ${NEON_RED}, inset 0 0 50px ${NEON_RED}`;
          setTimeout(() => { 
              if (canvas.parentElement) canvas.parentElement.style.boxShadow = 'none'; 
          }, 300);
      }

      if (livesRef.current <= 0) {
        endGame();
      }
    };

    const endGame = () => {
      gameRunningRef.current = false;
      setIsGameOver(true);
    };

    // --- Funcție ajutătoare pentru desenat cu strălucire ---
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

      // 1. Curățare Ecran (Fundal închis)
      ctx.fillStyle = BG_COLOR; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- 1b. DESENARE GRILĂ RETRO (Merge în jos) ---
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)'; // Cyan foarte transparent
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0; // Grila nu strălucește tare
      ctx.beginPath();
      
      const gridSpacing = 60;
      const gridOffset = (frameCount * 3) % gridSpacing; // Viteza grilei

      // Linii orizontale (care se mișcă)
      for (let i = -1; i < CANVAS_HEIGHT / gridSpacing + 1; i++) {
          const y = i * gridSpacing + gridOffset;
          ctx.moveTo(0, y);
          ctx.lineTo(CANVAS_WIDTH, y);
      }
      // Linii verticale (statice, pentru perspectivă)
      for (let i = 0; i <= CANVAS_WIDTH; i += gridSpacing) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i, CANVAS_HEIGHT);
      }
      ctx.stroke();
      ctx.restore();
      // -----------------------------------------


      // 2. Mișcare Jucător
      if (keys['ArrowLeft'] && player.x > 0) player.x -= playerSpeed;
      if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += playerSpeed;

      // --- DESENARE JUCĂTOR ---
      let playerColor = player.color;
      let blurAmount = 25;

      if (Date.now() - lastHitTime < 1000 && Math.floor(Date.now() / 100) % 2 === 0) {
        // Invincibil (pâlpâie gri/alb)
        playerColor = '#aaa';
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

      // 4. Generare Inamici
      if (frameCount % spawnRate === 0) {
        const xPos = Math.random() * (canvas.width - 40);
        enemies.push({ x: xPos, y: -40, width: 40, height: 40, color: NEON_RED });
      }

      // 5. Logică Inamici
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemySpeed;
        
        drawGlowingRect(enemy.x, enemy.y, enemy.width, enemy.height, enemy.color, 20);

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
            scoreRef.current += 50; // Scor mai mare
            setUiScore(scoreRef.current);
            break;
          }
        }
      }

      frameCount++;
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      gameRunningRef.current = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
      // Nu mai eliminăm link-ul fontului la unmount, poate fi folosit de alte pagini
    };
  }, []);

  // --- Stiluri UI Retro Fosforescent ---
  const containerStyle: React.CSSProperties = { 
      textAlign: 'center', 
      color: NEON_CYAN, 
      padding: '20px', 
      fontFamily: '"Press Start 2P", cursive',
      backgroundColor: '#020205', // Fundal general foarte închis
      minHeight: '100vh'
  };

  // Stil pentru text fosforescent
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

  // --- CSS pentru efectul de scanlines și vignetă ---
  const crtOverlayStyle: React.CSSProperties = {
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', // Lasă click-urile să treacă
      // Linii orizontale subtile (scanlines)
      backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
      backgroundSize: '100% 4px',
      // Vignetă (colțuri întunecate)
      boxShadow: 'inset 0 0 100px rgba(0,0,0,0.7)',
      zIndex: 10
  };

  return (
    <div style={containerStyle}>
      
      {/* Bara de UI Neon */}
      <div style={uiBarStyle}>
        <h3 style={{ margin: 0, fontSize: '16px', textShadow: textGlow(NEON_CYAN) }}>SCORE: {uiScore}</h3>
        <div style={{ fontSize: '20px', color: NEON_PINK, textShadow: textGlow(NEON_PINK) }}>
          LIVES: {Array.from({ length: Math.max(0, uiLives) }).map((_, i) => <span key={i} style={{ marginLeft: '8px' }}>❤️</span>)}
        </div>
        <button onClick={onExit} style={buttonStyle(NEON_CYAN)}>IEȘIRE</button>
      </div>
      
      {/* Container pentru Canvas și Efecte CRT */}
      <div style={{ 
          position: 'relative', 
          display: 'inline-block', 
          width: `${CANVAS_WIDTH}px`, 
          height: `${CANVAS_HEIGHT}px`,
          border: `4px solid ${NEON_CYAN}`,
          boxShadow: `0 0 40px ${NEON_CYAN}, inset 0 0 20px ${NEON_CYAN}`, // Strălucire dublă (ext și int)
          borderRadius: '4px',
          overflow: 'hidden'
      }}>
        <canvas 
          ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} 
          style={{ display: 'block', backgroundColor: BG_COLOR }}
        />

        {/* Stratul suprapus pentru efectul CRT/Scanlines */}
        <div style={crtOverlayStyle}></div>
        
        {/* Ecran Game Over Retro */}
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
            <button onClick={() => onGameOver(uiScore)} style={{...buttonStyle(NEON_YELLOW), fontSize: '16px', padding: '15px 30px', backgroundColor: 'rgba(255, 255, 0, 0.2)'}}>
              💾 SALVEAZĂ SCOR
            </button>
          </div>
        )}
      </div>
      <p style={{ color: '#aaa', marginTop: '25px', fontSize: '12px', textShadow: '0 0 5px #fff', opacity: 0.7 }}>
        ⬅️ ➡️ Mișcare | SPACE Tragere
      </p>
    </div>
  );
};

export default Game;
import { useEffect, useRef, useState } from 'react';
import { RetroBackground } from '../components/RetroBackground';
import { RetroButton, NeonColors } from '../components/RetroUI';
import dinoAsset from '../assets/dino.png';

const pixelCactus = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23f0f' x='14' y='4' width='4' height='28'/%3E%3Crect fill='%23f0f' x='18' y='10' width='4' height='4'/%3E%3Crect fill='%23f0f' x='10' y='18' width='4' height='4'/%3E%3C/svg%3E`;
const pixelPtero = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23f0f' x='8' y='12' width='16' height='8'/%3E%3Crect fill='%23f0f' x='0' y='8' width='8' height='4'/%3E%3Crect fill='%23f0f' x='24' y='8' width='8' height='4'/%3E%3Crect fill='%23000' x='15' y='13' width='2' height='2'/%3E%3C/svg%3E`;

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const GROUND_Y = CANVAS_HEIGHT - 80;

const DINO_SIZE = 150;
const JUMP_VELOCITY = 20;
const GRAVITY = 1;

// --- TIPARE ---
type ScoreRef = {
    current: number;
};

type GameProps = {
  onGameOver: (score: number) => void;
  onExit: () => void;
  scoreRef?: ScoreRef; // Ref-ul de scor din Crazy Mode (opțional)
  onScoreUpdate?: () => void; // Callback pentru actualizarea scorului total
};

// MODIFICARE: Destructurare prop-uri și definire Refs
const Dino = ({ onGameOver, onExit, scoreRef: externalScoreRef, onScoreUpdate }: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ref-uri pentru Logică
  const localScoreRef = useRef(0); // Ref local (fallback)
  const activeScoreRef = externalScoreRef || localScoreRef; // Ref-ul care va fi folosit
  
  const dinoYRef = useRef(GROUND_Y - DINO_SIZE);
  const velocityYRef = useRef(0);
  const isJumpingRef = useRef(false);
  const gameRunningRef = useRef(true);

  // Stare UI
  const [uiScore, setUiScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Sprite Refs
  const dinoImgRef = useRef(new Image());
  const cactusImgRef = useRef(new Image());
  const pteroImgRef = useRef(new Image());
  
  // Culori
  const NEON_GREEN = NeonColors.GREEN;
  const NEON_RED = NeonColors.RED;
  const BG_COLOR = '#050510'; 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use the provided PNG asset for the dino graphic
    dinoImgRef.current.src = dinoAsset;
    cactusImgRef.current.src = pixelCactus;
    pteroImgRef.current.src = pixelPtero;
    ctx.imageSmoothingEnabled = false; 

    // Resetări inițiale
    dinoYRef.current = GROUND_Y - DINO_SIZE;
    velocityYRef.current = 0;
    isJumpingRef.current = false;
    gameRunningRef.current = true;
    setIsGameOver(false);
    
    if (!externalScoreRef) { 
        activeScoreRef.current = 0;
    }
    setUiScore(activeScoreRef.current);


    let animationId: number;
    let obstacleTimer = 0;
    let obstacleInterval = 90; 
    
    let obstacles: { x: number, y: number, w: number, h: number, type: 'cactus' | 'ptero' }[] = [];

    const jump = () => {
      if (isJumpingRef.current || !gameRunningRef.current) return;
      isJumpingRef.current = true;
      velocityYRef.current = -JUMP_VELOCITY;
    };

    const endGame = () => {
      gameRunningRef.current = false;
      setIsGameOver(true);
      cancelAnimationFrame(animationId);
      // Trimitem scorul din Ref-ul activ
      onGameOver(activeScoreRef.current); 
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const drawGlowingSprite = (img: HTMLImageElement, x: number, y: number, w: number, h: number, color: string, blur: number = 20) => {
      if (!ctx) return;
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
      if (img.complete) {
          ctx.drawImage(img, x, y, w, h);
      }
      ctx.restore();
    };

    const loop = () => {
      if (!gameRunningRef.current || !ctx) return;

      // Calculul DIFICULTĂȚII
      const maxDifficultyScore = 1000.0;
      const difficultyFactor = Math.min(1, activeScoreRef.current / maxDifficultyScore); 
      
      const baseSpeed = 5;
      const maxSpeedIncrease = 3;
      const currentObstacleSpeed = baseSpeed + (maxSpeedIncrease * difficultyFactor); // VITEZA DINAMICĂ

      const maxDelay = 140; 
      const minDelay = 60;
      const currentMaxInterval = maxDelay - ((maxDelay - minDelay) * difficultyFactor);
      
      
      // 1. Curățare Ecran
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Aplică Gravitația și Săritura (Rămâne la fel)
      if (isJumpingRef.current) {
        dinoYRef.current += velocityYRef.current;
        velocityYRef.current += GRAVITY;

        if (dinoYRef.current >= GROUND_Y - DINO_SIZE) {
          dinoYRef.current = GROUND_Y - DINO_SIZE;
          isJumpingRef.current = false;
          velocityYRef.current = 0;
        }
      }
      
      // 3. Spawnează Obstacole
      if (obstacleTimer++ > obstacleInterval) {
        
        obstacleInterval = minDelay + Math.random() * (currentMaxInterval - minDelay);
        
        const type = Math.random() > 0.7 ? 'ptero' : 'cactus';
        let h, w, y;

           if (type === 'cactus') {
             // Double the original cactus size for clearer visibility
             w = 60; h = 80; y = GROUND_Y - h;
           } else {
             // Double the ptero size and place it higher above ground
             w = 80; h = 40; y = GROUND_Y - h - (DINO_SIZE + 20);
           }
        
        obstacles.push({ x: CANVAS_WIDTH, y: y, w: w, h: h, type: type });
        obstacleTimer = 0;
      }
      
      // 4. Mișcă și Desenează Obstacole
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= currentObstacleSpeed; // APLICĂ VITEZA DINAMICĂ

        // Desenare sprite
        const img = obs.type === 'cactus' ? cactusImgRef.current : pteroImgRef.current;
        drawGlowingSprite(img, obs.x, obs.y, obs.w, obs.h, NeonColors.PINK, 15);

        // Curăță obstacolele ieșite din ecran
        if (obs.x + obs.w < 0) {
          obstacles.splice(i, 1);
          
          // [2] SCORARE: Folosim activeScoreRef și notificăm părintele
          activeScoreRef.current += 1; 
          setUiScore(activeScoreRef.current);
          if (onScoreUpdate) { 
              onScoreUpdate(); // Notifică CrazyMode
          }
        }

        // 5. Verificare Coliziune
        const dinoX = 50; 
        const dinoY = dinoYRef.current;

        if (
          dinoX < obs.x + obs.w && dinoX + DINO_SIZE > obs.x &&
          dinoY < obs.y + obs.h && dinoY + DINO_SIZE > obs.y
        ) {
          endGame();
          return;
        }
      }

      // 6. Desenare Dino
      drawGlowingSprite(dinoImgRef.current, 50, dinoYRef.current, DINO_SIZE, DINO_SIZE, NeonColors.GREEN, 25);

      // 7. Desenare Sol
      ctx.strokeStyle = NeonColors.GREEN;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.shadowColor = NeonColors.GREEN;
      ctx.shadowBlur = 10;
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.stroke();

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    // Curățare la demontare
    return () => {
      gameRunningRef.current = false;
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationId);
    };
  }, [activeScoreRef, externalScoreRef, onScoreUpdate]); // Dependențe

  // Stiluri UI (Rămân la fel)
  const uiBarStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: `${CANVAS_WIDTH}px`, margin: '0 auto 20px auto',
    backgroundColor: 'rgba(0, 30, 0, 0.8)', padding: '15px 25px', 
    border: `3px solid ${NeonColors.GREEN}`, 
    boxShadow: `0 0 25px ${NeonColors.GREEN}, inset 0 0 10px ${NeonColors.GREEN}`,
    borderRadius: '10px', boxSizing: 'border-box', color: 'white', fontFamily: '"Press Start 2P", cursive'
  };

  return (
    <RetroBackground>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        
        {/* Bara UI */}
        <div style={uiBarStyle}>
          <h3 style={{ margin: 0, textShadow: `0 0 10px ${NeonColors.GREEN}` }}>DINO SCORE: {uiScore}</h3>
          <RetroButton variant="green" onClick={onExit} style={{ width: 'auto', marginTop: 0, padding: '10px 20px' }}>
            IEȘIRE
          </RetroButton>
        </div>

        <div style={{ 
            position: 'relative', 
            border: `4px solid ${NeonColors.GREEN}`,
            boxShadow: `0 0 30px ${NeonColors.GREEN}`,
            backgroundColor: '#000'
        }}>
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            style={{ display: 'block' }}
          />

          {isGameOver && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', 
              justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)'
            }}>
              <h1 style={{ color: NeonColors.RED, fontSize: '40px', textShadow: `0 0 20px ${NeonColors.RED}`, marginBottom: '20px' }}>GAME OVER</h1>
              <p style={{ color: 'white', fontFamily: '"Press Start 2P"', marginBottom: '30px' }}>Final Score: {uiScore}</p>
              <RetroButton variant="green" onClick={() => onGameOver(activeScoreRef.current)}>
                💾 SAVE SCORE
              </RetroButton>
            </div>
          )}
        </div>

        <p style={{ color: '#aaa', marginTop: '20px', fontFamily: '"Press Start 2P"', fontSize: '10px' }}>
          PRESS SPACE or UP ARROW to jump!
        </p>
      </div>
    </RetroBackground>
  );
};

export default Dino;
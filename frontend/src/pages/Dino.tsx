import { useEffect, useRef, useState } from 'react';
import { RetroBackground } from '../components/RetroBackground';
import { RetroButton, NeonColors } from '../components/RetroUI';
import dinoAsset from '../assets/dino.png';

const SPRITE_COLORS = ['00ff00', 'ff00ff', '00ffff', 'ffff00', 'ff0000'];

const generateCactusSVG = (color: string) => 
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23${color}' x='14' y='4' width='4' height='28'/%3E%3Crect fill='%23${color}' x='18' y='10' width='4' height='4'/%3E%3Crect fill='%23${color}' x='10' y='18' width='4' height='4'/%3E%3C/svg%3E`;

const generatePteroSVG = (color: string) => 
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23${color}' x='8' y='12' width='16' height='8'/%3E%3Crect fill='%23${color}' x='0' y='8' width='8' height='4'/%3E%3Crect fill='%23${color}' x='24' y='8' width='8' height='4'/%3E%3Crect fill='%23000' x='15' y='13' width='2' height='2'/%3E%3C/svg%3E`;

const getRandomColor = () => SPRITE_COLORS[Math.floor(Math.random() * SPRITE_COLORS.length)];

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const GROUND_Y = CANVAS_HEIGHT - 80;

const DINO_SIZE = 100;
const JUMP_VELOCITY = 15;
const GRAVITY = 0.6;

const CACTUS_HEIGHT = 80;
const CACTUS_WIDTH = 60;

const PTERO_HEIGHT = 80;
const PTERO_WIDTH = 130;

type ScoreRef = {
    current: number;
};

type GameProps = {
  onGameOver: (score: number) => void;
  onExit: () => void;
  scoreRef?: ScoreRef;
  onScoreUpdate?: () => void;
};

const Dino = ({ onGameOver, onExit, scoreRef: externalScoreRef, onScoreUpdate }: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const localScoreRef = useRef(0);
  const activeScoreRef = externalScoreRef || localScoreRef; 
  
  const dinoYRef = useRef(GROUND_Y - DINO_SIZE);
  const velocityYRef = useRef(0);
  const isJumpingRef = useRef(false);
  const gameRunningRef = useRef(true);

  const [uiScore, setUiScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const dinoImgRef = useRef(new Image());
  const cactusImgRef = useRef(new Image());
  const pteroImgRef = useRef(new Image());
  
  const BG_COLOR = '#050510'; 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    dinoImgRef.current.src = dinoAsset;
    ctx.imageSmoothingEnabled = false; 

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
    
    const spriteColors = [NeonColors.PINK, NeonColors.CYAN, NeonColors.GREEN, NeonColors.YELLOW, NeonColors.RED];
    
    let obstacles: { x: number, y: number, w: number, h: number, type: 'cactus' | 'ptero', color: string, spriteSrc: string }[] = [];

    const jump = () => {
      if (isJumpingRef.current || !gameRunningRef.current) return;
      isJumpingRef.current = true;
      velocityYRef.current = -JUMP_VELOCITY;
    };

    const endGame = () => {
      gameRunningRef.current = false;
      setIsGameOver(true);
      cancelAnimationFrame(animationId);
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
      if (!gameRunningRef.current || !ctx)
          return;


      const maxDifficultyScore = 1000.0;
      const difficultyFactor = Math.min(1, activeScoreRef.current / maxDifficultyScore); 
      
      const baseSpeed = 5;
      const maxSpeedIncrease = 3;
      const currentObstacleSpeed = baseSpeed + (maxSpeedIncrease * difficultyFactor); 

      const maxDelay = 140; 
      const minDelay = 60;
      const currentMaxInterval = maxDelay - ((maxDelay - minDelay) * difficultyFactor);
      
      
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (isJumpingRef.current) {
        dinoYRef.current += velocityYRef.current;
        velocityYRef.current += GRAVITY;

        if (dinoYRef.current >= GROUND_Y - DINO_SIZE) {
          dinoYRef.current = GROUND_Y - DINO_SIZE;
          isJumpingRef.current = false;
          velocityYRef.current = 0;
        }
      }
      
      // spawn obstacles
      if (obstacleTimer++ > obstacleInterval) {
        
        obstacleInterval = minDelay + Math.random() * (currentMaxInterval - minDelay);
        
        const type = Math.random() > 0.7 ? 'ptero' : 'cactus';
        const spriteColor = getRandomColor();
        let h, w, y, spriteSrc;

           if (type === 'cactus') {
             w = CACTUS_WIDTH; h = CACTUS_HEIGHT; y = GROUND_Y - h;
             spriteSrc = generateCactusSVG(spriteColor);
           } else {
             w = PTERO_WIDTH; h = PTERO_HEIGHT; y = GROUND_Y - h - (DINO_SIZE + 20);
             spriteSrc = generatePteroSVG(spriteColor);
           }
        
        obstacles.push({ x: CANVAS_WIDTH, y: y, w: w, h: h, type: type, color: spriteColor, spriteSrc: spriteSrc });
        obstacleTimer = 0;
      }
      
      // move and draw obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= currentObstacleSpeed;

        if (!('img' in obs)) {
          const img = new Image();
          img.src = obs.spriteSrc;
          (obs as any).img = img;
        }
        const img = (obs as any).img;
        drawGlowingSprite(img, obs.x, obs.y, obs.w, obs.h, obs.color, 15);

        // delete off-screen obstacles
        if (obs.x + obs.w < 0) {
          obstacles.splice(i, 1);
          
          activeScoreRef.current += 1; 
          setUiScore(activeScoreRef.current);
          if (onScoreUpdate) { 
              onScoreUpdate();
          }
        }

        // check collisions
        const dinoX = 20; 
        const dinoY = dinoYRef.current;
        
        const COLLISION_PADDING = 5;

        if (
          dinoX + COLLISION_PADDING < obs.x + obs.w && 
          dinoX + DINO_SIZE - COLLISION_PADDING > obs.x &&
          dinoY + COLLISION_PADDING < obs.y + obs.h && 
          dinoY + DINO_SIZE - COLLISION_PADDING > obs.y
        ) {
          endGame();
          return;
        }
      }

      // draw dino
      drawGlowingSprite(dinoImgRef.current, 50, dinoYRef.current, DINO_SIZE, DINO_SIZE, NeonColors.GREEN, 25);

      // draw ground
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

    return () => {
      gameRunningRef.current = false;
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationId);
    };
  }, [activeScoreRef, externalScoreRef, onScoreUpdate]);

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
        
        {/* UI bar */}
        <div style={uiBarStyle}>
          <h3 style={{ margin: 0, textShadow: `0 0 10px ${NeonColors.GREEN}` }}>DINO SCORE: {uiScore}</h3>
          <RetroButton variant="green" onClick={onExit} style={{ width: 'auto', marginTop: 0, padding: '10px 20px' }}>
            EXIT
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

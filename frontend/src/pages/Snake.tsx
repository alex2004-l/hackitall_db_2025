import { useEffect, useRef, useState } from 'react';
import { RetroBackground } from '../components/RetroBackground';
import { RetroButton, NeonColors } from '../components/RetroUI';

type Point = { x: number, y: number };

const GRID_SIZE = 25; 
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const COLS = CANVAS_WIDTH / GRID_SIZE;
const ROWS = CANVAS_HEIGHT / GRID_SIZE;
const GAME_SPEED = 300; 

type ScoreRef = {
    current: number;
};

type GameProps = {
  onGameOver: (score: number) => void;
  onExit: () => void;
  scoreRef?: ScoreRef;
  onScoreUpdate?: () => void; 
};

const SnakeGame = ({ onGameOver, onExit, scoreRef: externalScoreRef, onScoreUpdate }: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]); 
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const directionRef = useRef<Point>({ x: 1, y: 0 }); 
  
  const localScoreRef = useRef(0); 
  const activeScoreRef = externalScoreRef || localScoreRef;
  
  const gameRunningRef = useRef(true);

  const isGlitchingRef = useRef(false); 
  const [glitchActiveUI, setGlitchActiveUI] = useState(false); 
  const [uiScore, setUiScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const textGlow = (color: string) => `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resetare stare
    snakeRef.current = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    directionRef.current = { x: 1, y: 0 };
    isGlitchingRef.current = false;
    setGlitchActiveUI(false);
    
    if (!externalScoreRef) {
        activeScoreRef.current = 0;
    }
    setUiScore(activeScoreRef.current);
    gameRunningRef.current = true;
    spawnFood();

    const handleKeyDown = (e: KeyboardEvent) => {
      const { x, y } = directionRef.current;
      
      switch(e.key) {
        case 'ArrowUp': 
          if (y === 0) directionRef.current = { x: 0, y: -1 }; break; 
        case 'ArrowDown': 
          if (y === 0) directionRef.current = { x: 0, y: 1 }; break;  
        case 'ArrowLeft': 
          if (x === 0) directionRef.current = { x: -1, y: 0 }; break; 
        case 'ArrowRight': 
          if (x === 0) directionRef.current = { x: 1, y: 0 }; break; 
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    function spawnFood() {
      let newFood: Point = { x: 0, y: 0 };
      let isOnSnake = false;
      
      const spawnCols = COLS - 2; 
      const spawnRows = ROWS - 2;

      do {
        newFood = {
          x: Math.floor(Math.random() * spawnCols) + 1, 
          y: Math.floor(Math.random() * spawnRows) + 1
        };
        isOnSnake = snakeRef.current.some(seg => seg.x === newFood.x && seg.y === newFood.y);
      } while (isOnSnake);
      
      foodRef.current = newFood;
    }

    function gameOver() {
      gameRunningRef.current = false;
      setIsGameOver(true);
      onGameOver(activeScoreRef.current);
    }

    function drawRect(x: number, y: number, color: string, glow: boolean = true) {
      if (!ctx) return;
      ctx.fillStyle = color;
      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
      ctx.shadowBlur = 0;
    }

    let lastTime = 0;

    const loop = (timestamp: number) => {
      if (!gameRunningRef.current) return;

      const deltaTime = timestamp - lastTime;

      if (deltaTime >= GAME_SPEED) {
        lastTime = timestamp;

        const head = { ...snakeRef.current[0] };
        head.x += directionRef.current.x;
        head.y += directionRef.current.y;

        // Check walls
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
          gameOver();
          return; 
        }

        // Check self
        if (snakeRef.current.some(seg => seg.x === head.x && seg.y === head.y)) {
          gameOver();
          return;
        }

        snakeRef.current.unshift(head); 

        // Eat Food
        if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
          activeScoreRef.current += 50;
          setUiScore(activeScoreRef.current);

          if (activeScoreRef.current >= 150 && !isGlitchingRef.current) {
            isGlitchingRef.current = true;
            setGlitchActiveUI(true); 
          }

          if (onScoreUpdate) {
            onScoreUpdate(); 
          }
          spawnFood();
        } else {
          snakeRef.current.pop(); 
        }
      }

      let bgCol = '#050510';
      if (isGlitchingRef.current && Math.random() > 0.95) {
         bgCol = Math.random() > 0.5 ? NeonColors.RED : '#ffffff';
      }
      ctx.fillStyle = bgCol;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save(); 
      
      if (isGlitchingRef.current && Math.random() > 0.6) {
        const shakeX = (Math.random() - 0.5) * 15; 
        const shakeY = (Math.random() - 0.5) * 15; 
        ctx.translate(shakeX, shakeY);
      }


      ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) { ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); }
      for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) { ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); }
      ctx.stroke();

      drawRect(foodRef.current.x, foodRef.current.y, NeonColors.PINK);

      snakeRef.current.forEach((seg, index) => {
        let color = index === 0 ? '#fff' : NeonColors.GREEN;
        if (isGlitchingRef.current && Math.random() > 0.95) color = NeonColors.RED;
        drawRect(seg.x, seg.y, color, true);
      });

      ctx.restore();

      if (isGlitchingRef.current && Math.random() > 0.8) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
          const h = Math.random() * 20 + 2;
          const y = Math.random() * CANVAS_HEIGHT;
          ctx.fillRect(0, y, CANVAS_WIDTH, h);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    return () => {
      gameRunningRef.current = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [externalScoreRef, activeScoreRef, onScoreUpdate]); 

  const borderColor = glitchActiveUI ? NeonColors.RED : NeonColors.GREEN;
  const shadowColor = glitchActiveUI ? NeonColors.RED : NeonColors.GREEN;

  const uiBarStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: `${CANVAS_WIDTH}px`, margin: '0 auto 20px auto',
    backgroundColor: 'rgba(0, 20, 0, 0.8)', padding: '15px 25px', 
    border: `3px solid ${borderColor}`, 
    boxShadow: `0 0 25px ${shadowColor}, inset 0 0 10px ${shadowColor}`,
    borderRadius: '10px', boxSizing: 'border-box', color: 'white', fontFamily: '"Press Start 2P", cursive',
    transition: 'all 0.3s ease'
  };

  return (
    <RetroBackground>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        
        <div style={uiBarStyle}>
          <h3 style={{ margin: 0, textShadow: `0 0 10px ${borderColor}`, color: glitchActiveUI ? NeonColors.RED : '#fff' }}>
            SNAKE SCORE: {uiScore}
          </h3>
          <RetroButton variant="green" onClick={onExit} style={{ width: 'auto', marginTop: 0, padding: '10px 20px' }}>
            EXIT
          </RetroButton>
        </div>

        <div style={{ 
            position: 'relative', 
            border: `4px solid ${borderColor}`,
            boxShadow: `0 0 30px ${shadowColor}`,
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
            <h1 style={{ color: NeonColors.RED, fontSize: '45px', margin: '0 0 30px 0', textShadow: textGlow(NeonColors.RED) }}>GAME OVER</h1>
              <p style={{ fontSize: '22px', color: '#fff', margin: '0 0 40px 0', textShadow: textGlow('#fff') }}>Final Score: {uiScore}</p>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <RetroButton variant="yellow" onClick={() => onExit()}>
                  ⬅️ BACK
                </RetroButton>
              </div>
          </div>
        )}
        </div>

        <p style={{ color: '#aaa', marginTop: '20px', fontFamily: '"Press Start 2P"', fontSize: '10px' }}>
          ⬆️⬇️⬅️➡️ FOR CONTROLLING THE SNAKE MOVEMENT
        </p>
      </div>
    </RetroBackground>
  );
};

export default SnakeGame;

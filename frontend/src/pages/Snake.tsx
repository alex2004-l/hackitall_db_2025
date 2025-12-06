import { useEffect, useRef, useState } from 'react';
import { RetroBackground } from '../components/RetroBackground';
import { RetroButton, NeonColors } from '../components/RetroUI';

type Point = { x: number, y: number };

// Configurări Joc
const GRID_SIZE = 25; 
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const COLS = CANVAS_WIDTH / GRID_SIZE;
const ROWS = CANVAS_HEIGHT / GRID_SIZE;
const GAME_SPEED = 300; 

type GameProps = {
  onGameOver: (score: number) => void;
  onExit: () => void;
};

const SnakeGame = ({ onGameOver, onExit }: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Stare Logică 
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]); 
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const directionRef = useRef<Point>({ x: 1, y: 0 }); 
  const nextDirectionRef = useRef<Point>({ x: 1, y: 0 }); 
  const scoreRef = useRef(0);
  const gameRunningRef = useRef(true);

  // Stare UI
  const [uiScore, setUiScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resetare joc
    snakeRef.current = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    scoreRef.current = 0;
    setUiScore(0);
    gameRunningRef.current = true;
    spawnFood();

    // Controale
    const handleKeyDown = (e: KeyboardEvent) => {
      const { x, y } = directionRef.current;
      
      switch(e.key) {
        case 'ArrowUp': 
          if (y === 0) nextDirectionRef.current = { x: 0, y: -1 }; break;
        case 'ArrowDown': 
          if (y === 0) nextDirectionRef.current = { x: 0, y: 1 }; break;
        case 'ArrowLeft': 
          if (x === 0) nextDirectionRef.current = { x: -1, y: 0 }; break;
        case 'ArrowRight': 
          if (x === 0) nextDirectionRef.current = { x: 1, y: 0 }; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Funcție random pentru mâncare
    function spawnFood() {
        let newFood: Point = { x: 0, y: 0 };
        let isOnSnake = false;
        
        // NOU: Definim o zonă de spawnare mai sigură.
        // Excludem primul rând/coloană (index 0) și ultimul (index COLS-1 / ROWS-1)
        const spawnCols = COLS - 2; // Spațiul de la 1 la COLS - 2
        const spawnRows = ROWS - 2;
    
        do {
          newFood = {
            // Generăm X: între 1 și COLS - 2
            x: Math.floor(Math.random() * spawnCols) + 1, 
            // Generăm Y: între 1 și ROWS - 2
            y: Math.floor(Math.random() * spawnRows) + 1
          };
          // Verificăm să nu apară mâncarea pe șarpe
          // eslint-disable-next-line no-loop-func
          isOnSnake = snakeRef.current.some(seg => seg.x === newFood.x && seg.y === newFood.y);
        } while (isOnSnake);
        
        foodRef.current = newFood;
      }

    function gameOver() {
      gameRunningRef.current = false;
      setIsGameOver(true);
    }

    // Desenare Pătrat Neon
    function drawRect(x: number, y: number, color: string, glow: boolean = true) {
      if (!ctx) return;
      ctx.fillStyle = color;
      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowBlur = 0;
      }
      // Lăsăm 1px spațiu între segmente pentru aspect de grilă
      ctx.fillRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
      ctx.shadowBlur = 0; // Reset glow
    }

    let lastTime = 0;

    // --- BUCLA PRINCIPALĂ ---
    const loop = (timestamp: number) => {
      if (!gameRunningRef.current) return;

      const deltaTime = timestamp - lastTime;

      // Actualizăm logica doar la intervalul definit (GAME_SPEED)
      if (deltaTime >= GAME_SPEED) {
        lastTime = timestamp;

        // 1. Actualizare Direcție
        directionRef.current = nextDirectionRef.current;
        const head = { ...snakeRef.current[0] };
        head.x += directionRef.current.x;
        head.y += directionRef.current.y;

        // 2. Verificare Coliziuni (Pereți)
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
          gameOver();
          return; // Stop loop
        }

        // 3. Verificare Coliziuni (Coada)
        if (snakeRef.current.some(seg => seg.x === head.x && seg.y === head.y)) {
          gameOver();
          return;
        }

        // 4. Mișcare Șarpe
        snakeRef.current.unshift(head); // Adăugăm noul cap

        // 5. Verificare Mâncare
        if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
          // Am mâncat
          scoreRef.current += 10;
          setUiScore(scoreRef.current);
          spawnFood();
          // Nu ștergem coada, deci șarpele crește
        } else {
          snakeRef.current.pop(); // Ștergem coada (mișcare normală)
        }
      }

      // --- DESENARE (La fiecare frame, pentru fluiditate vizuală) ---
      // 1. Curățare
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Desenare Grilă (Subtilă)
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) { ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); }
      for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) { ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); }
      ctx.stroke();

      // 3. Desenare Mâncare (Măr)
      drawRect(foodRef.current.x, foodRef.current.y, NeonColors.PINK);

      // 4. Desenare Șarpe
      snakeRef.current.forEach((seg, index) => {
        // Capul e mai strălucitor
        const color = index === 0 ? '#fff' : NeonColors.GREEN; 
        drawRect(seg.x, seg.y, color, true);
      });

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    return () => {
      gameRunningRef.current = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Stiluri CSS inline pentru containere
  const uiBarStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: `${CANVAS_WIDTH}px`, margin: '0 auto 20px auto',
    backgroundColor: 'rgba(0, 20, 0, 0.8)', padding: '15px 25px', // Verde închis
    border: `3px solid ${NeonColors.GREEN}`, 
    boxShadow: `0 0 25px ${NeonColors.GREEN}, inset 0 0 10px ${NeonColors.GREEN}`,
    borderRadius: '10px', boxSizing: 'border-box', color: 'white', fontFamily: '"Press Start 2P", cursive'
  };

  return (
    <RetroBackground>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        
        {/* Bara UI */}
        <div style={uiBarStyle}>
          <h3 style={{ margin: 0, textShadow: `0 0 10px ${NeonColors.GREEN}` }}>SNAKE SCORE: {uiScore}</h3>
          <RetroButton variant="green" onClick={onExit} style={{ width: 'auto', marginTop: 0, padding: '10px 20px' }}>
            IEȘIRE
          </RetroButton>
        </div>

        {/* Canvas Container */}
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

          {/* Ecran Game Over */}
          {isGameOver && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', 
              justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)'
            }}>
              <h1 style={{ color: NeonColors.RED, fontSize: '40px', textShadow: `0 0 20px ${NeonColors.RED}`, marginBottom: '20px' }}>GAME OVER</h1>
              <p style={{ color: 'white', fontFamily: '"Press Start 2P"', marginBottom: '30px' }}>Scor Final: {uiScore}</p>
              <RetroButton variant="green" onClick={() => onGameOver(uiScore)}>
                💾 SALVEAZĂ SCOR
              </RetroButton>
            </div>
          )}
        </div>

        <p style={{ color: '#aaa', marginTop: '20px', fontFamily: '"Press Start 2P"', fontSize: '10px' }}>
          ⬆️⬇️⬅️➡️ pentru a controla șarpele
        </p>
      </div>
    </RetroBackground>
  );
};

export default SnakeGame;
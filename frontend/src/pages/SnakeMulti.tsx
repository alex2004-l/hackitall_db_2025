import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { RetroBackground } from '../components/RetroBackground';
import { RetroButton, NeonColors } from '../components/RetroUI';

const GRID_SIZE = 20; // Mai mic pentru a încăpea două ecrane
const CANVAS_SIZE = 400; // 20x20 grid

const SnakeMulti = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role'); // 'host' (player1) sau 'guest' (player2)
  const isPlayer1 = role === 'host';
  const navigate = useNavigate();

  // Refs pentru Canvas
  const myCanvasRef = useRef<HTMLCanvasElement>(null);
  const oppCanvasRef = useRef<HTMLCanvasElement>(null);

  // Stare Locală (Jocul meu)
  const mySnakeRef = useRef([{x: 5, y: 5}]);
  const myDirRef = useRef({x: 1, y: 0});
  
  // Stare Adversar (Venită din Firebase)
  const [opponentSnake, setOpponentSnake] = useState([{x: 10, y: 10}]);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gameStatus, setGameStatus] = useState('waiting');

  // --- 1. SINCRONIZARE CU FIREBASE (Ascultăm adversarul) ---
  useEffect(() => {
    if (!roomId) return;
    
    const unsub = onSnapshot(doc(db, "rooms", roomId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameStatus(data.status);

        // Dacă eu sunt P1, adversarul e P2
        const oppData = isPlayer1 ? data.player2 : data.player1;
        
        if (oppData) {
          setOpponentSnake(oppData.snake);
          setOpponentScore(oppData.score);
        }
      }
    });
    return () => unsub();
  }, [roomId, isPlayer1]);

  // --- 2. LOGICA JOCULUI MEU (Loop) ---
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const moveSnake = async () => {
      // Logică mișcare (simplificată aici)
      const head = { ...mySnakeRef.current[0] };
      head.x += myDirRef.current.x;
      head.y += myDirRef.current.y;
      
      // Update local array
      mySnakeRef.current.unshift(head);
      mySnakeRef.current.pop();

      // TRIMITERE DATE CĂTRE FIREBASE (Aici e cheia multiplayer!)
      // Trimitem noua poziție a șarpelui meu în baza de date
      const fieldToUpdate = isPlayer1 ? "player1.snake" : "player2.snake";
      if (roomId) {
          // Atenție: Asta face multe scrieri!
          await updateDoc(doc(db, "rooms", roomId), {
            [fieldToUpdate]: mySnakeRef.current
          });
      }
    };

    const gameInterval = setInterval(moveSnake, 200); // 200ms viteză
    
    // Controale
    const handleKey = (e: KeyboardEvent) => {
        if(e.key === 'ArrowUp') myDirRef.current = {x:0, y:-1};
        if(e.key === 'ArrowDown') myDirRef.current = {x:0, y:1};
        if(e.key === 'ArrowLeft') myDirRef.current = {x:-1, y:0};
        if(e.key === 'ArrowRight') myDirRef.current = {x:1, y:0};
    };
    window.addEventListener('keydown', handleKey);

    return () => {
        clearInterval(gameInterval);
        window.removeEventListener('keydown', handleKey);
    };
  }, [gameStatus, roomId, isPlayer1]);

  // --- 3. DESENARE (Render Loop) ---
  useEffect(() => {
    // Desenăm ecranul MEU
    const drawMyGame = () => {
        const ctx = myCanvasRef.current?.getContext('2d');
        if(!ctx) return;
        ctx.fillStyle = '#000'; ctx.fillRect(0,0, CANVAS_SIZE, CANVAS_SIZE);
        
        // Șarpele meu (Verde)
        ctx.fillStyle = NeonColors.GREEN;
        mySnakeRef.current.forEach(seg => ctx.fillRect(seg.x*GRID_SIZE, seg.y*GRID_SIZE, GRID_SIZE-2, GRID_SIZE-2));
    };

    // Desenăm ecranul ADVERSARULUI
    const drawOpponentGame = () => {
        const ctx = oppCanvasRef.current?.getContext('2d');
        if(!ctx) return;
        ctx.fillStyle = '#111'; ctx.fillRect(0,0, CANVAS_SIZE, CANVAS_SIZE); // Fundal mai gri
        
        // Șarpele lui (Roșu/Roz)
        ctx.fillStyle = NeonColors.PINK;
        opponentSnake.forEach(seg => ctx.fillRect(seg.x*GRID_SIZE, seg.y*GRID_SIZE, GRID_SIZE-2, GRID_SIZE-2));
    };

    const frameId = requestAnimationFrame(function render() {
        drawMyGame();
        drawOpponentGame();
        requestAnimationFrame(render);
    });

    return () => cancelAnimationFrame(frameId);
  }, [opponentSnake]); // Redesenăm când se schimbă datele adversarului

  return (
    <RetroBackground>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px', color: 'white' }}>
            <h2>MULTIPLAYER ARENA</h2>
            
            {/* ID-ul camerei pentru a-l da prietenului */}
            {gameStatus === 'waiting' && (
                <div style={{border: '1px solid yellow', padding: 10, marginBottom: 20}}>
                    WAITING FOR PLAYER 2... <br/>
                    ROOM ID: <span style={{color: NeonColors.YELLOW}}>{roomId}</span>
                </div>
            )}

            <div style={{ display: 'flex', gap: '50px' }}>
                {/* Ecranul MEU */}
                <div>
                    <div style={{textAlign: 'center', color: NeonColors.GREEN, marginBottom: 5}}>YOU</div>
                    <canvas ref={myCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{border: `4px solid ${NeonColors.GREEN}`}} />
                </div>

                {/* Ecranul ADVERSARULUI */}
                <div>
                    <div style={{textAlign: 'center', color: NeonColors.PINK, marginBottom: 5}}>OPPONENT</div>
                    <canvas ref={oppCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{border: `4px solid ${NeonColors.PINK}`}} />
                </div>
            </div>
            
            <RetroButton variant="red" onClick={() => navigate('/dashboard')} style={{marginTop: 30}}>EXIT</RetroButton>
        </div>
    </RetroBackground>
  );
};

export default SnakeMulti;
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseClient";

import { RetroBackground } from "../components/RetroBackground";
import { RetroButton, NeonColors } from "../components/RetroUI";

const GRID_SIZE = 25;
const CANVAS_W = 800;
const CANVAS_H = 600;
const COLS = CANVAS_W / GRID_SIZE;
const ROWS = CANVAS_H / GRID_SIZE;
const GAME_SPEED = 150;

export default function SnakeMulti() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPlayer1 = searchParams.get("role") === "host";

  const myCanvasRef = useRef<HTMLCanvasElement>(null);
  const oppCanvasRef = useRef<HTMLCanvasElement>(null);

  // Start Positions
  const startPos = isPlayer1
    ? [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }]
    : [{ x: 25, y: 10 }, { x: 26, y: 10 }, { x: 27, y: 10 }];

  const startDir = isPlayer1 ? { x: 1, y: 0 } : { x: -1, y: 0 };

  const mySnakeRef = useRef(startPos);
  const myDirRef = useRef(startDir);
  const myScoreRef = useRef(0);

  const [opponentSnake, setOpponentSnake] = useState([{ x: -1, y: -1 }]);
  const [opponentScore, setOpponentScore] = useState(0);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [gameStatus, setGameStatus] = useState("waiting");
  const [isGameOver, setIsGameOver] = useState(false);

  // 1️⃣ PLAYER 2 JOIN
  useEffect(() => {
    if (!roomId || isPlayer1) return;

    const joinGame = async () => {
      const docRef = doc(db, "rooms", roomId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (!data.player2) {
          await updateDoc(docRef, {
            player2: { snake: startPos, score: 0, dir: startDir },
          });
        }
      }
    };
    joinGame();
  }, [roomId, isPlayer1]);

  // 2️⃣ SYNC & GAME OVER CHECK
  useEffect(() => {
    if (!roomId) return;

    const unsub = onSnapshot(doc(db, "rooms", roomId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      setGameStatus(data.status);
      if (data.food) setFood(data.food);

      // Sincronizare adversar
      const opp = isPlayer1 ? data.player2 : data.player1;
      if (opp) {
        if (opp.snake) setOpponentSnake(opp.snake);
        // Important: Sincronizăm scorul chiar și la Game Over
        if (opp.score !== undefined) setOpponentScore(opp.score);
      }

      // Dacă statusul e gameover, oprim tot
      if (data.status === "gameover") {
        setIsGameOver(true);
      }

      // Auto-start
      if (isPlayer1 && data.status === "waiting" && data.player2) {
        updateDoc(doc(db, "rooms", roomId), { status: "playing" });
      }
    });

    return () => unsub();
  }, [roomId, isPlayer1]);

  // 🔥 SPAWN FOOD
  const spawnFood = async () => {
    if (!roomId) return;
    let newFood = { x: 0, y: 0 };
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * (COLS - 2)) + 1,
        y: Math.floor(Math.random() * (ROWS - 2)) + 1,
      };
      const onSnake = mySnakeRef.current.some(
        (s) => s.x === newFood.x && s.y === newFood.y
      );
      if (!onSnake) break;
    }
    updateDoc(doc(db, "rooms", roomId), { food: newFood });
  };

  // 3️⃣ GAME LOOP
  useEffect(() => {
    if (gameStatus !== "playing" || isGameOver) return;

    const move = async () => {
      const snake = [...mySnakeRef.current];
      const head = { ...snake[0] };

      head.x += myDirRef.current.x;
      head.y += myDirRef.current.y;

      // Detectare Coliziuni
      const hitWall = head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS;
      const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);

      // 💀 LOGICA DE MOARTE (PENALIZARE -100)
      if (hitWall || hitSelf) {
        setIsGameOver(true);
        myScoreRef.current -= 100; // Scădem 100 puncte

        await updateDoc(doc(db, "rooms", roomId!), {
          [isPlayer1 ? "player1.score" : "player2.score"]: myScoreRef.current, // Trimitem scorul penalizat
          status: "gameover",
        });
        return;
      }

      snake.unshift(head);

      // A mâncat?
      if (head.x === food.x && head.y === food.y) {
        myScoreRef.current += 10;
        updateDoc(doc(db, "rooms", roomId!), {
          [isPlayer1 ? "player1.score" : "player2.score"]: myScoreRef.current,
        });
        spawnFood();
      } else {
        snake.pop();
      }

      mySnakeRef.current = snake;

      updateDoc(doc(db, "rooms", roomId!), {
        [isPlayer1 ? "player1.snake" : "player2.snake"]: snake,
      }).catch(() => {});
    };

    const interval = setInterval(move, GAME_SPEED);

    const handleKey = (e: KeyboardEvent) => {
      const { x, y } = myDirRef.current;
      if (e.key === "ArrowUp" && y === 0) myDirRef.current = { x: 0, y: -1 };
      if (e.key === "ArrowDown" && y === 0) myDirRef.current = { x: 0, y: 1 };
      if (e.key === "ArrowLeft" && x === 0) myDirRef.current = { x: -1, y: 0 };
      if (e.key === "ArrowRight" && x === 0) myDirRef.current = { x: 1, y: 0 };
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKey);
    };
  }, [gameStatus, isGameOver, food]);

  // 4️⃣ DRAWING
  useEffect(() => {
    const draw = () => {
      const myCtx = myCanvasRef.current?.getContext("2d");
      const oppCtx = oppCanvasRef.current?.getContext("2d");

      const paint = (ctx: CanvasRenderingContext2D, snake: any[], color: string, isMe: boolean) => {
        ctx.fillStyle = isMe ? "#050510" : "#100010";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Grid
        ctx.strokeStyle = "rgba(0,255,0,0.1)";
        ctx.beginPath();
        for (let i = 0; i <= CANVAS_W; i += GRID_SIZE) { ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_H); }
        for (let i = 0; i <= CANVAS_H; i += GRID_SIZE) { ctx.moveTo(0, i); ctx.lineTo(CANVAS_W, i); }
        ctx.stroke();

        // Food
        if (food) {
          ctx.fillStyle = NeonColors.RED;
          ctx.shadowColor = NeonColors.RED;
          ctx.shadowBlur = 15;
          ctx.fillRect(food.x * GRID_SIZE + 2, food.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
          ctx.shadowBlur = 0;
        }

        // Snake
        snake.forEach((s, i) => {
          ctx.fillStyle = i === 0 ? "#fff" : color;
          ctx.shadowColor = color;
          ctx.shadowBlur = i === 0 ? 15 : 5;
          ctx.fillRect(s.x * GRID_SIZE + 1, s.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
          ctx.shadowBlur = 0;
        });
      };

      if (myCtx) paint(myCtx, mySnakeRef.current, NeonColors.GREEN, true);
      if (oppCtx) paint(oppCtx, opponentSnake, NeonColors.PINK, false);

      requestAnimationFrame(draw);
    };
    const animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [food, opponentSnake]);

  // 🏆 Logică determinare câștigător
  const getWinnerMessage = () => {
    if (myScoreRef.current > opponentScore) return "YOU WON! 🏆";
    if (myScoreRef.current < opponentScore) return "YOU LOST 💀";
    return "DRAW 🤝";
  };

  return (
    <RetroBackground>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100vh", padding: 20 }}>
        {/* TOP BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", width: "90%", maxWidth: 1200, background: "#000", border: `2px solid ${NeonColors.GREEN}`, padding: 15, marginBottom: 20, color: "#fff", fontFamily: '"Press Start 2P"' }}>
          <div>ROOM: {roomId}</div>
          <div style={{ color: gameStatus === "playing" ? NeonColors.GREEN : NeonColors.YELLOW }}>
            {gameStatus === "playing" ? "🟢 LIVE MATCH" : "🟡 WAITING..."}
          </div>
          <RetroButton onClick={() => navigate("/dashboard")}>EXIT</RetroButton>
        </div>

        {/* SCREENS */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", alignItems: "center" }}>
          <div>
            <div style={{ color: NeonColors.GREEN, textAlign: "center", marginBottom: 10, fontFamily: '"Press Start 2P"' }}>YOU ({myScoreRef.current})</div>
            <canvas ref={myCanvasRef} width={CANVAS_W} height={CANVAS_H} style={{ border: `4px solid ${NeonColors.GREEN}`, background: "#000", width: "600px", height: "450px" }} />
          </div>
          <div style={{ color: "#fff", fontSize: 30, fontFamily: '"Press Start 2P"' }}>VS</div>
          <div>
            <div style={{ color: NeonColors.PINK, textAlign: "center", marginBottom: 10, fontFamily: '"Press Start 2P"' }}>OPPONENT ({opponentScore})</div>
            <canvas ref={oppCanvasRef} width={CANVAS_W} height={CANVAS_H} style={{ border: `4px solid ${NeonColors.PINK}`, background: "#000", width: "600px", height: "450px" }} />
          </div>
        </div>

        {/* GAME OVER MODAL */}
        {isGameOver && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
            <h1 style={{ color: myScoreRef.current > opponentScore ? NeonColors.GREEN : NeonColors.RED, fontSize: 50, fontFamily: '"Press Start 2P"', marginBottom: 20, textAlign: "center", lineHeight: "1.5em" }}>
              {getWinnerMessage()}
            </h1>
            <h2 style={{ color: "#fff", fontFamily: '"Press Start 2P"', fontSize: 20, marginBottom: 40 }}>
              FINAL SCORE: {myScoreRef.current} - {opponentScore}
            </h2>
            <RetroButton onClick={() => navigate("/dashboard")}>EXIT TO LOBBY</RetroButton>
          </div>
        )}
      </div>
    </RetroBackground>
  );
}
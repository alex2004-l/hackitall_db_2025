import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
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

  // canvas refs
  const myCanvasRef = useRef<HTMLCanvasElement>(null);
  const oppCanvasRef = useRef<HTMLCanvasElement>(null);

  // snake state local
  const mySnakeRef = useRef([{ x: 10, y: 10 }]);
  const myDirRef = useRef({ x: 1, y: 0 });
  const myScoreRef = useRef(0);

  // state primit din Firebase
  const [opponentSnake, setOpponentSnake] = useState([{ x: 10, y: 10 }]);
  const [opponentScore, setOpponentScore] = useState(0);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [gameStatus, setGameStatus] = useState("waiting");

  const [isGameOver, setIsGameOver] = useState(false);

  // 🔥 Sincronizare Firebase + AUTO START
  useEffect(() => {
    if (!roomId) return;

    const unsub = onSnapshot(doc(db, "rooms", roomId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      setGameStatus(data.status);
      setFood(data.food);

      const opp = isPlayer1 ? data.player2 : data.player1;
      if (opp) {
        if (opp.snake) setOpponentSnake(opp.snake);
        if (opp.score !== undefined) setOpponentScore(opp.score);
      }

      // ✅ LOGICA NOUĂ: Dacă ești Host și a intrat Player 2, pornește jocul
      if (isPlayer1 && data.status === "waiting" && data.player2) {
        updateDoc(doc(db, "rooms", roomId), {
          status: "playing",
        }).catch((err) => console.error("Error starting game:", err));
      }
    });

    return () => unsub();
  }, [roomId, isPlayer1]);

  // 🔥 Spawn food random (doar host)
  const spawnFood = async () => {
    if (!roomId) return;
    let newFood = { x: 0, y: 0 };
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * (COLS - 2)) + 1,
        y: Math.floor(Math.random() * (ROWS - 2)) + 1,
      };
      // Verificăm să nu fie pe șarpele nostru (ideal ar fi să verificăm și opponentul)
      if (!mySnakeRef.current.some((s) => s.x === newFood.x && s.y === newFood.y)) break;
    }

    await updateDoc(doc(db, "rooms", roomId), { food: newFood });
  };

  // 🔥 Logica de joc
  useEffect(() => {
    if (gameStatus !== "playing" || isGameOver) return;
    if (!roomId) return;

    const move = async () => {
      const snake = [...mySnakeRef.current];
      const head = { ...snake[0] };

      head.x += myDirRef.current.x;
      head.y += myDirRef.current.y;

      // ❗ Game Over – perete
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        setIsGameOver(true);
        await updateDoc(doc(db, "rooms", roomId), {
          [isPlayer1 ? "player1.score" : "player2.score"]: myScoreRef.current,
          status: "gameover", // Poți scoate asta dacă vrei ca celălalt să continue
        });
        return;
      }

      // ❗ Game Over – self collision
      if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
        setIsGameOver(true);
        await updateDoc(doc(db, "rooms", roomId), {
          [isPlayer1 ? "player1.score" : "player2.score"]: myScoreRef.current,
          status: "gameover",
        });
        return;
      }

      snake.unshift(head);

      // 🔥 A mâncat?
      if (head.x === food.x && head.y === food.y) {
        myScoreRef.current += 10;

        await updateDoc(doc(db, "rooms", roomId), {
          [isPlayer1 ? "player1.score" : "player2.score"]: myScoreRef.current,
        });

        if (isPlayer1) await spawnFood();
      } else {
        snake.pop();
      }

      mySnakeRef.current = snake;

      await updateDoc(doc(db, "rooms", roomId), {
        [isPlayer1 ? "player1.snake" : "player2.snake"]: snake,
      });
    };

    const interval = setInterval(move, GAME_SPEED);

    const controls = (e: KeyboardEvent) => {
      const { x, y } = myDirRef.current;
      if (e.key === "ArrowUp" && y === 0) myDirRef.current = { x: 0, y: -1 };
      if (e.key === "ArrowDown" && y === 0) myDirRef.current = { x: 0, y: 1 };
      if (e.key === "ArrowLeft" && x === 0) myDirRef.current = { x: -1, y: 0 };
      if (e.key === "ArrowRight" && x === 0) myDirRef.current = { x: 1, y: 0 };
    };

    window.addEventListener("keydown", controls);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", controls);
    };
  }, [gameStatus, isGameOver, roomId, isPlayer1, food]);

  // 🔥 Desenare Retro
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "rgba(0,255,0,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < CANVAS_W; x += GRID_SIZE) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
    }
    for (let y = 0; y < CANVAS_H; y += GRID_SIZE) {
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
    }
    ctx.stroke();
  };

  const drawCell = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
    ctx.shadowBlur = 0;
  };

  // 🔥 Render Loop
  useEffect(() => {
    const loop = () => {
      const myCtx = myCanvasRef.current?.getContext("2d");
      const oppCtx = oppCanvasRef.current?.getContext("2d");

      if (myCtx) {
        myCtx.fillStyle = "#050510";
        myCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        drawGrid(myCtx);
        drawCell(myCtx, food.x, food.y, NeonColors.PINK);

        mySnakeRef.current.forEach((s, i) =>
          drawCell(myCtx, s.x, s.y, i === 0 ? "#fff" : NeonColors.GREEN)
        );
      }

      if (oppCtx) {
        oppCtx.fillStyle = "#100010";
        oppCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        drawGrid(oppCtx);
        drawCell(oppCtx, food.x, food.y, NeonColors.PINK);

        opponentSnake.forEach((s, i) =>
          drawCell(oppCtx, s.x, s.y, i === 0 ? "#fff" : NeonColors.PINK)
        );
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }, [food, opponentSnake]);

  return (
    <RetroBackground>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 20,
          height: "100vh",
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "80%",
            background: "rgba(0,20,0,0.8)",
            padding: "10px 20px",
            marginBottom: 20,
            borderRadius: 10,
            color: "#fff",
            border: `3px solid ${NeonColors.GREEN}`,
          }}
        >
          <div>ROOM: {roomId}</div>
          <div
            style={{
              color: gameStatus === "playing" ? NeonColors.GREEN : NeonColors.YELLOW,
            }}
          >
            {gameStatus === "playing" ? "LIVE MATCH" : "WAITING OPPONENT..."}
          </div>
          <RetroButton onClick={() => navigate("/dashboard")}>EXIT</RetroButton>
        </div>

        {/* 🔥 ECRANE LÂNGĂ LÂNGĂ */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 40,
            justifyContent: "center",
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          {/* ECRANUL TĂU */}
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                color: NeonColors.GREEN,
                fontFamily: '"Press Start 2P"',
              }}
            >
              YOU ({myScoreRef.current})
            </h3>

            <canvas
              ref={myCanvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                border: `6px solid ${NeonColors.GREEN}`,
                boxShadow: `0 0 20px ${NeonColors.GREEN}`,
              }}
            />
          </div>

          {/* VS */}
          <div
            style={{
              fontSize: 50,
              color: "#fff",
              fontFamily: '"Press Start 2P"',
              textShadow: "0 0 10px #fff",
              marginTop: CANVAS_H / 2 - 25,
            }}
          >
            VS
          </div>

          {/* ECRANUL ADVERSARULUI */}
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                color: NeonColors.PINK,
                fontFamily: '"Press Start 2P"',
              }}
            >
              OPPONENT ({opponentScore})
            </h3>

            <canvas
              ref={oppCanvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                border: `6px solid ${NeonColors.PINK}`,
                boxShadow: `0 0 20px ${NeonColors.PINK}`,
              }}
            />
          </div>
        </div>

        {isGameOver && (
          <h1
            style={{
              color: NeonColors.RED,
              marginTop: 40,
              fontFamily: '"Press Start 2P"',
            }}
          >
            GAME OVER
          </h1>
        )}
      </div>
    </RetroBackground>
  );
}
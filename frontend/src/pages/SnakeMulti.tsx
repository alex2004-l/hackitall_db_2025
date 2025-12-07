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
const GAME_SPEED = 150; // Viteza jocului (mai mic = mai rapid)

export default function SnakeMulti() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPlayer1 = searchParams.get("role") === "host";

  // canvas refs
  const myCanvasRef = useRef<HTMLCanvasElement>(null);
  const oppCanvasRef = useRef<HTMLCanvasElement>(null);

  // 🔥 CONFIGURARE INIȚIALĂ (Player 1 Stânga, Player 2 Dreapta)
  const startPos = isPlayer1
    ? [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }]
    : [{ x: 25, y: 10 }, { x: 26, y: 10 }, { x: 27, y: 10 }];

  const startDir = isPlayer1 ? { x: 1, y: 0 } : { x: -1, y: 0 };

  // snake state local (Ref pentru viteză maximă fără re-render)
  const mySnakeRef = useRef(startPos);
  const myDirRef = useRef(startDir);
  const myScoreRef = useRef(0);

  // state primit din Firebase
  const [opponentSnake, setOpponentSnake] = useState([{ x: -1, y: -1 }]); // Ascuns inițial
  const [opponentScore, setOpponentScore] = useState(0);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [gameStatus, setGameStatus] = useState("waiting");
  const [isGameOver, setIsGameOver] = useState(false);

  // 1️⃣ LOGICĂ PLAYER 2: Se anunță în DB când intră
  useEffect(() => {
    if (!roomId || isPlayer1) return;

    const joinGame = async () => {
      const docRef = doc(db, "rooms", roomId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        // Dacă nu exist în DB, mă scriu
        if (!data.player2) {
          await updateDoc(docRef, {
            player2: {
              snake: startPos,
              score: 0,
              dir: startDir,
            },
          });
        }
      }
    };
    joinGame();
  }, [roomId, isPlayer1]);

  // 2️⃣ LOGICĂ PLAYER 1 (HOST): Detectează Player 2 și dă START
  useEffect(() => {
    if (!roomId) return;

    const unsub = onSnapshot(doc(db, "rooms", roomId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      setGameStatus(data.status);
      if (data.food) setFood(data.food);

      // Actualizăm adversarul
      const opp = isPlayer1 ? data.player2 : data.player1;
      if (opp) {
        if (opp.snake) setOpponentSnake(opp.snake);
        if (opp.score !== undefined) setOpponentScore(opp.score);
      }

      // Host-ul pornește meciul dacă vede Player 2
      if (isPlayer1 && data.status === "waiting" && data.player2) {
        updateDoc(doc(db, "rooms", roomId), { status: "playing" });
      }
    });

    return () => unsub();
  }, [roomId, isPlayer1]);

  // 🔥 SPAWN FOOD (Doar Host)
  const spawnFood = async () => {
    if (!roomId) return;
    let newFood = { x: 0, y: 0 };
    // Încercăm să nu punem mâncarea pe șarpele meu
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
    // Update non-blocking (fără await)
    updateDoc(doc(db, "rooms", roomId), { food: newFood });
  };

  // 3️⃣ GAME LOOP (Aici e mișcarea)
  useEffect(() => {
    if (gameStatus !== "playing" || isGameOver) return;

    const move = () => {
      const snake = [...mySnakeRef.current];
      const head = { ...snake[0] };

      head.x += myDirRef.current.x;
      head.y += myDirRef.current.y;

      // COLIZIUNE PERETE
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        setIsGameOver(true);
        updateDoc(doc(db, "rooms", roomId!), { status: "gameover" });
        return;
      }

      // COLIZIUNE CU SINE
      if (snake.some((s) => s.x === head.x && s.y === head.y)) {
        setIsGameOver(true);
        updateDoc(doc(db, "rooms", roomId!), { status: "gameover" });
        return;
      }

      snake.unshift(head);

      // A MÂNCAT?
      if (head.x === food.x && head.y === food.y) {
        myScoreRef.current += 10;
        updateDoc(doc(db, "rooms", roomId!), {
          [isPlayer1 ? "player1.score" : "player2.score"]: myScoreRef.current,
        });
        if (isPlayer1) spawnFood();
      } else {
        snake.pop();
      }

      // Actualizăm ref-ul local (pentru desenare instantă)
      mySnakeRef.current = snake;

      // Trimitem la Firebase (fără await, să nu sacadeze)
      updateDoc(doc(db, "rooms", roomId!), {
        [isPlayer1 ? "player1.snake" : "player2.snake"]: snake,
      }).catch((e) => console.log("Lag sync:", e));
    };

    const interval = setInterval(move, GAME_SPEED);

    // CONTROLS
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
  }, [gameStatus, isGameOver, food]); // Scoatem roomId/isPlayer1 din dependințe ca să nu reseteze intervalul aiurea

  // 4️⃣ DESENARE (60 FPS)
  useEffect(() => {
    const draw = () => {
      const myCtx = myCanvasRef.current?.getContext("2d");
      const oppCtx = oppCanvasRef.current?.getContext("2d");

      // Funcție helper desenare
      const paint = (
        ctx: CanvasRenderingContext2D,
        snake: any[],
        color: string,
        isMe: boolean
      ) => {
        ctx.fillStyle = isMe ? "#050510" : "#100010"; // Background diferit
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Grid
        ctx.strokeStyle = "rgba(0,255,0,0.1)";
        ctx.beginPath();
        for (let i = 0; i <= CANVAS_W; i += GRID_SIZE) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i, CANVAS_H);
        }
        for (let i = 0; i <= CANVAS_H; i += GRID_SIZE) {
          ctx.moveTo(0, i);
          ctx.lineTo(CANVAS_W, i);
        }
        ctx.stroke();

        // Food
        if (food) {
          ctx.fillStyle = NeonColors.RED;
          ctx.shadowColor = NeonColors.RED;
          ctx.shadowBlur = 15;
          ctx.fillRect(
            food.x * GRID_SIZE + 2,
            food.y * GRID_SIZE + 2,
            GRID_SIZE - 4,
            GRID_SIZE - 4
          );
          ctx.shadowBlur = 0;
        }

        // Snake
        snake.forEach((s, i) => {
          ctx.fillStyle = i === 0 ? "#fff" : color; // Cap alb
          ctx.shadowColor = color;
          ctx.shadowBlur = i === 0 ? 15 : 5;
          ctx.fillRect(
            s.x * GRID_SIZE + 1,
            s.y * GRID_SIZE + 1,
            GRID_SIZE - 2,
            GRID_SIZE - 2
          );
          ctx.shadowBlur = 0;
        });
      };

      if (myCtx)
        paint(myCtx, mySnakeRef.current, NeonColors.GREEN, true);
      if (oppCtx)
        paint(oppCtx, opponentSnake, NeonColors.PINK, false);

      requestAnimationFrame(draw);
    };

    const animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [food, opponentSnake]); // Redesenează când se schimbă mâncarea sau oponentul

  return (
    <RetroBackground>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "100vh",
          padding: 20,
        }}
      >
        {/* SCORE BAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "90%",
            maxWidth: 1200,
            background: "#000",
            border: `2px solid ${NeonColors.GREEN}`,
            padding: 15,
            marginBottom: 20,
            color: "#fff",
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          <div>ROOM: {roomId}</div>
          <div
            style={{
              color:
                gameStatus === "playing" ? NeonColors.GREEN : NeonColors.YELLOW,
            }}
          >
            {gameStatus === "playing" ? "🟢 LIVE MATCH" : "🟡 WAITING..."}
          </div>
          <RetroButton onClick={() => navigate("/dashboard")}>
            EXIT
          </RetroButton>
        </div>

        {/* GAME AREA */}
        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* MY SCREEN */}
          <div>
            <div
              style={{
                color: NeonColors.GREEN,
                textAlign: "center",
                marginBottom: 10,
                fontFamily: '"Press Start 2P"',
              }}
            >
              YOU ({myScoreRef.current})
            </div>
            <canvas
              ref={myCanvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                border: `4px solid ${NeonColors.GREEN}`,
                background: "#000",
                width: "600px", // Scalare CSS pt ecrane mai mici
                height: "450px",
              }}
            />
          </div>

          {/* VS SEPARATOR */}
          <div
            style={{
              color: "#fff",
              fontSize: 30,
              fontFamily: '"Press Start 2P"',
            }}
          >
            VS
          </div>

          {/* OPPONENT SCREEN */}
          <div>
            <div
              style={{
                color: NeonColors.PINK,
                textAlign: "center",
                marginBottom: 10,
                fontFamily: '"Press Start 2P"',
              }}
            >
              OPPONENT ({opponentScore})
            </div>
            <canvas
              ref={oppCanvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                border: `4px solid ${NeonColors.PINK}`,
                background: "#000",
                width: "600px",
                height: "450px",
              }}
            />
          </div>
        </div>

        {isGameOver && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0,0,0,0.9)",
              padding: 40,
              border: `5px solid ${NeonColors.RED}`,
              textAlign: "center",
            }}
          >
            <h1 style={{ color: NeonColors.RED, fontSize: 40 }}>GAME OVER</h1>
            <RetroButton onClick={() => window.location.reload()}>
              REMATCH
            </RetroButton>
          </div>
        )}
      </div>
    </RetroBackground>
  );
}
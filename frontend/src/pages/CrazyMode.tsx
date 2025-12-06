// src/pages/CrazyMode.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Chicken from './Chicken';
import Snake from './Snake';
import Dino from './Dino';
import { RetroButton, RetroTitle, RetroCard, NeonColors } from '../components/RetroUI';
import { RetroBackground } from '../components/RetroBackground'; // Adaugă importul

// Maparea componentelor la jocuri
const games = [
    { name: 'Chicken Invaders', component: Chicken, id: 'chicken' },
    { name: 'Neon Snake', component: Snake, id: 'snake' },
    { name: 'Dino Run', component: Dino, id: 'dino' },
];

// Props din App.tsx
interface CrazyModeProps {
    onModeEnd: (finalScore: number, gameId: string) => void;
}

// --- STILURI PENTRU LAYOUT-UL LATERAL NOU ---
const styles: Record<string, React.CSSProperties> = {
    // Container principal: Ocupă tot spațiul sub RetroBackground
    mainLayout: {
        display: 'flex', 
        minHeight: '100vh', // Se întinde pe toată înălțimea viewport-ului
        padding: '20px',
        gap: '20px', // Spațiu între sidebar și joc
        boxSizing: 'border-box'
    },
    // Stil pentru RetroCard care devine bara laterală (220px lățime fixă)
    sidebarCard: {
        width: '220px', 
        height: '90vh', // Înălțimea aproape completă
        padding: '20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column', // Stack content vertical
        justifyContent: 'flex-start', // Conținutul începe de sus
        alignItems: 'center',
    },
    // Wrapper pentru joc: Ocupă spațiul rămas și centrează jocul
    gameAreaWrapper: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center', // Centrează jocul pe verticală
    }
};
// ---------------------------------------------


const CrazyMode = ({ onModeEnd }: CrazyModeProps) => {
    const [currentScore, setCurrentScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [currentGameIndex, setCurrentGameIndex] = useState(Math.floor(Math.random() * games.length));
    const [gameKey, setGameKey] = useState(0); 
    
    const scoreRef = useRef(0);
    const currentGameScoreRef = useRef(0); 
    
    const CurrentGameComponent = games[currentGameIndex].component;
    const currentGameName = games[currentGameIndex].name;
    const navigate = useNavigate();

    const handleScoreDisplayUpdate = useCallback(() => {
        // Scorul total vizibil este scorul salvat + scorul rundei curente
        setCurrentScore(scoreRef.current + currentGameScoreRef.current);
    }, []);

    // 1. Logica de comutare a jocului (Timer)
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    // Când timpul expiră:
                    
                    // 1a. Salvăm scorul rundei curente la total
                    scoreRef.current += currentGameScoreRef.current;
                    setCurrentScore(scoreRef.current);
                    currentGameScoreRef.current = 0; // Resetăm scorul rundei
                    
                    // 1b. Comutăm jocul și resetăm timerul
                    setCurrentGameIndex(prevIndex => (prevIndex + 1) % games.length);
                    setGameKey(prevKey => prevKey + 1); // Forțează montarea noului joc
                    return 30; // Reset cronometru
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentGameIndex]);

    // 2. Handler de PIERDERE (Game Over) - Oprește modul complet
    const handleActualGameOver = useCallback((finalRoundScore: number) => {
        const totalFinalScore = scoreRef.current + finalRoundScore;
        onModeEnd(totalFinalScore, games[currentGameIndex].id); 
    }, [onModeEnd, currentGameIndex]);

    return (
        <RetroBackground>
            {/* CONTAINER PRINCIPAL: FLEX ROW */}
            <div style={styles.mainLayout}> 
            
                {/* 1. BARA LATERALĂ (RetroCard) */}
                <RetroCard style={styles.sidebarCard} color={NeonColors.PINK}>
                    
                    <RetroTitle size="18px" color={NeonColors.RED}>🔥 CRAZY MODE 🔥</RetroTitle>
                    <p style={{ color: NeonColors.YELLOW, marginTop: '20px' }}>
                            TOTAL SCORE:
                    </p>
                    <h1 style={{ color: NeonColors.CYAN, fontSize: '32px', textShadow: `0 0 15px ${NeonColors.CYAN}` }}>
                        {currentScore}
                    </h1>
                    
                    <hr style={{ width: '80%', border: `1px dashed ${NeonColors.PINK}` }} />
                    
                    <p style={{ color: NeonColors.YELLOW, marginTop: '20px', marginBottom: '5px' }}>
                            CURRENT GAME:
                    </p>
                    <h2 style={{ color: NeonColors.PINK, fontSize: '14px', marginBottom: '20px' }}>
                        {currentGameName}
                    </h2>
                    
                    <p style={{ color: NeonColors.YELLOW }}>
                            TIME LEFT:
                    </p>
                    <h1 style={{ color: timeLeft <= 5 ? NeonColors.RED : NeonColors.CYAN, fontSize: '40px', textShadow: '0 0 20px', marginBottom: '30px' }}>
                        {timeLeft}
                    </h1>

                    <RetroButton variant="red" onClick={() => navigate('/dashboard')} style={{ width: '100%', marginTop: 'auto' }}>
                        EXIT MODE
                    </RetroButton>

                </RetroCard>
                
                {/* 2. ZONA DE JOC CENTRATĂ */}
                <div style={styles.gameAreaWrapper}>
                    <CurrentGameComponent 
                        key={gameKey}
                        onGameOver={handleActualGameOver}
                        onExit={() => navigate('/dashboard')} 
                        scoreRef={currentGameScoreRef} // Transmitem Ref-ul pentru actualizare
                        onScoreUpdate={handleScoreDisplayUpdate}
                    />
                </div>
            </div>
        </RetroBackground>
    );
}

export default CrazyMode;
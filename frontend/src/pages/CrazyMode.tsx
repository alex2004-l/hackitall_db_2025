// src/pages/CrazyMode.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Chicken from './Chicken';
import Snake from './Snake';
import Dino from './Dino';
import { RetroButton, RetroTitle, RetroCard, NeonColors } from '../components/RetroUI';
import { RetroBackground } from '../components/RetroBackground';

const games = [
    { name: 'Chicken Invaders', component: Chicken, id: 'chicken' },
    { name: 'Neon Snake', component: Snake, id: 'snake' },
    { name: 'Dino Run', component: Dino, id: 'dino' },
];

interface CrazyModeProps {
    onModeEnd: (finalScore: number, gameId: string) => void;
}

const styles: Record<string, React.CSSProperties> = {
    mainLayout: {
        display: 'flex', 
        minHeight: '100vh',
        padding: '20px',
        gap: '20px',
        boxSizing: 'border-box'
    },

    sidebarCard: {
        width: '220px', 
        height: '90vh',
        padding: '20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    
    gameAreaWrapper: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center', 
    }
};

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
        setCurrentScore(scoreRef.current + currentGameScoreRef.current);
    }, []);

    // timer game change
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    // save the round score before switching
                    scoreRef.current += currentGameScoreRef.current;
                    setCurrentScore(scoreRef.current);
                    currentGameScoreRef.current = 0;
                    
                    // change game
                    setCurrentGameIndex(prevIndex => (prevIndex + 1) % games.length);
                    setGameKey(prevKey => prevKey + 1); 
                    return 30;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentGameIndex]);

    // game over
    const handleActualGameOver = useCallback((finalRoundScore: number) => {
        const totalFinalScore = scoreRef.current + finalRoundScore;
        onModeEnd(totalFinalScore, games[currentGameIndex].id); 
    }, [onModeEnd, currentGameIndex]);

    return (
        <RetroBackground>
            <div style={styles.mainLayout}> 
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
                
                <div style={styles.gameAreaWrapper}>
                    <CurrentGameComponent 
                        key={gameKey}
                        onGameOver={handleActualGameOver}
                        onExit={() => navigate('/dashboard')} 
                        scoreRef={currentGameScoreRef}
                        onScoreUpdate={handleScoreDisplayUpdate}
                    />
                </div>
            </div>
        </RetroBackground>
    );
}

export default CrazyMode;
// src/pages/CrazyMode.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Chicken from './Chicken';
import Snake from './Snake';
import Dino from './Dino';
import {RetroTitle, RetroCard, NeonColors } from '../components/RetroUI';
import { RetroBackground } from '../components/RetroBackground';

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

const CrazyMode = ({ onModeEnd }: CrazyModeProps) => {
    const [currentScore, setCurrentScore] = useState(0); // Scor total UI
    const [timeLeft, setTimeLeft] = useState(30); // Cronometru
    const [currentGameIndex, setCurrentGameIndex] = useState(Math.floor(Math.random() * games.length));
    const [gameKey, setGameKey] = useState(0); // Forțează reîncărcarea componentului jocului
    
    const scoreRef = useRef(0); // Scor total real
    const currentGameScoreRef = useRef(0); // Scor de la jocul curent
    
    const CurrentGameComponent = games[currentGameIndex].component;
    const currentGameName = games[currentGameIndex].name;
    const navigate = useNavigate();

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
        // Adăugăm scorul rundei pierdute la total
        const totalFinalScore = scoreRef.current + finalRoundScore;
        onModeEnd(totalFinalScore, games[currentGameIndex].id); // Notificăm App.tsx să salveze scorul final
    }, [onModeEnd, currentGameIndex]);


    return (
        <RetroBackground>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <RetroCard style={{ maxWidth: '800px', width: '100%', margin: '0 auto 20px auto' }} color={NeonColors.PINK}>
                    <RetroTitle size="18px" color={NeonColors.RED}>🔥 CRAZY MODE 🔥</RetroTitle>
                    <p style={{ color: NeonColors.YELLOW, marginBottom: '10px' }}>
                        NEXT: {currentGameName} IN: <span style={{ color: timeLeft <= 5 ? NeonColors.RED : NeonColors.CYAN, textShadow: '0 0 5px', fontSize: '1.2em' }}>{timeLeft}s</span> | TOTAL SCORE: {currentScore}
                    </p>
                </RetroCard>
                
                <div style={{ marginTop: '10px' }}>
                    <CurrentGameComponent 
                        key={gameKey} // Cheia forțează reîncărcarea
                        // Când jucătorul pierde, trimitem scorul total final
                        onGameOver={handleActualGameOver} 
                        onExit={() => navigate('/dashboard')} 
                        // Transmitem ref-ul pentru ca jocul să actualizeze scorul direct
                        scoreRef={currentGameScoreRef} 
                    />
                </div>
            </div>
        </RetroBackground>
    );
}

export default CrazyMode;
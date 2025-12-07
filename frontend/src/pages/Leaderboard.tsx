import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore'; 
// @ts-ignore
import { db } from '../firebaseClient';
import { RetroBackground } from '../components/RetroBackground';
import { RetroCard, RetroTitle, RetroButton, NeonColors } from '../components/RetroUI';

interface ScoreEntry {
  id: string;
  email?: string;
  username?: string;
  realUsername?: string;
  score: number;
  game?: string;
  uid?: string;
}

// --- NEW CONSTANT: Define all game modes ---
const GAME_MODES = [
  { id: "crazymode", name: "CRAZY MODE" }, 
  { id: "snake", name: "SNAKE" },         
  { id: "dino", name: "DINO JUMP" },
  { id: "chicken_invaders", name: "CHICKEN INVADERS" }   
];
// ------------------------------------------

const Leaderboard = () => {
  const navigate = useNavigate();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState(GAME_MODES[0].id); // <-- NEW STATE

  const fetchScores = useCallback(async () => {
    setLoading(true); 
    setErrorMsg(null);
    
    try {
      // 1. Query scores for the active game
      const q = query(
        collection(db, "scores"),
        where("game", "==", activeGame), // <-- Uses activeGame
        orderBy("score", "desc"),
        limit(100) 
      );

      const snapshot = await getDocs(q);
      
      const uniqueScores: ScoreEntry[] = [];
      const seenUsers = new Set<string>();
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const userId = data.uid || data.email;

        if (!userId) continue;
        if (seenUsers.has(userId)) continue;

        let candidateName = data.username;
        if (!candidateName && data.email) candidateName = data.email.split('@')[0];
        
        if (!candidateName || 
            candidateName.toLowerCase().includes("unknown") || 
            candidateName.toLowerCase().includes("anon")) {
          continue;
        }

        seenUsers.add(userId);

        uniqueScores.push({
          id: docSnap.id,
          email: data.email,
          username: data.username,
          score: typeof data.score === 'number' ? data.score : 0,
          uid: userId
        });
      }

      const top20 = uniqueScores.slice(0, 20);

      // 2. Fetch usernames for the top 20
      const enrichedScores = await Promise.all(top20.map(async (entry) => {
          if (!entry.uid) return entry;
          try {
              const userSnap = await getDoc(doc(db, "User", entry.uid));
              if (userSnap.exists()) {
                  const userData = userSnap.data();
                  return { ...entry, realUsername: userData.username };
              }
          } catch (e) {
              console.error("User fetch err:", e);
          }
          return entry;
      }));
      
      setScores(enrichedScores);

    } catch (error: any) {
      console.error("Eroare Leaderboard:", error);
      if (error.message.includes("requires an index")) {
          setErrorMsg("LIPSEȘTE INDEXUL FIREBASE. Verifică consola (F12).");
      } else {
          setErrorMsg(`EROARE: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [activeGame]); // <-- Dependency on activeGame

  useEffect(() => {
    fetchScores();
  }, [fetchScores]); // <-- Trigger fetch when component loads or activeGame changes

  const getDisplayName = (entry: ScoreEntry) => {
    if (entry.realUsername) return entry.realUsername;
    if (entry.username) return entry.username; 
    return "PLAYER";
  };
  
  // Helper to get the display name of the currently active game
  const activeGameName = GAME_MODES.find(g => g.id === activeGame)?.name || "LEADERBOARD";

  return (
    <RetroBackground>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', minHeight: '100vh', position: 'relative', zIndex: 20 }}>
      <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '30px', 
            justifyContent: 'center',
           
            width: '100%', 
            maxWidth: '700px', 
            padding: '0 40px', 
            boxSizing: 'border-box'
      }}>
        {GAME_MODES.map((game) => (
          <RetroButton 
            key={game.id}
            variant={activeGame === game.id ? "red" : "cyan"} 
            onClick={() => setActiveGame(game.id)}
            style={{ 
              padding: '8px 16px', 
              fontSize: '12px', 
              flexGrow: 1, 
              flexShrink: 1, 
              minWidth: '0' 
            }}
          >
            {game.name}
          </RetroButton>
        ))}
      </div>


        <RetroCard color={NeonColors.RED} style={{ width: '100%', maxWidth: '700px', padding: '30px', backgroundColor: '#050505', boxShadow: `0 0 30px ${NeonColors.RED}` }}>
          
          <RetroTitle size="24px" color={NeonColors.RED}>{activeGameName} CHAMPIONS</RetroTitle>
          <p style={{ color: '#aaa', fontSize: '10px', marginBottom: '30px', textTransform: 'uppercase' }}>
            CLICK ON A NAME TO VIEW PROFILE
          </p>

          {errorMsg ? (
             <div style={{ color: NeonColors.RED }}>⚠️ {errorMsg}</div>
          ) : loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: NeonColors.YELLOW, animation: 'blink 1s infinite' }}>LOADING DATA...</div>
          ) : (
            <div style={{ maxHeight: '60vh', overflowY: 'auto', border: `2px solid ${NeonColors.RED}`, backgroundColor: '#000' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#111', zIndex: 5 }}>
                  <tr style={{ color: NeonColors.RED, borderBottom: `2px solid ${NeonColors.RED}` }}>
                    <th style={{ padding: '15px', width: '50px', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>PLAYER</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>BEST</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                        NO SCORES AVAILABLE FOR {activeGameName}
                      </td>
                    </tr>
                  ) : (
                    scores.map((entry, index) => {
                      let rowColor = 'white';
                      if (index === 0) rowColor = NeonColors.YELLOW;
                      else if (index === 1) rowColor = '#c0c0c0';
                      else if (index === 2) rowColor = '#cd7f32';

                      return (
                        <tr 
                          key={entry.id} 
                          onClick={() => entry.uid && navigate(`/profile/${entry.uid}`)}
                          style={{ 
                            color: rowColor, 
                            borderBottom: '1px solid #222', 
                            backgroundColor: index % 2 === 0 ? '#0a0a0a' : '#000',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#220000'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#0a0a0a' : '#000'}
                        >
                          <td style={{ padding: '15px', textAlign: 'center' }}>{index + 1}.</td>
                          <td style={{ padding: '15px', textAlign: 'left' }}>
                            <span style={{ marginRight: '10px' }}>👤</span>
                            {getDisplayName(entry).toUpperCase()}
                          </td>
                          <td style={{ padding: '15px', textAlign: 'right', color: NeonColors.GREEN }}>
                            {entry.score}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <RetroButton variant="yellow" onClick={() => navigate('/dashboard')} style={{ maxWidth: '200px' }}>BACK</RetroButton>
          </div>

        </RetroCard>
      </div>
    </RetroBackground>
  );
};

export default Leaderboard;

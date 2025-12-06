import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
// @ts-ignore
import { db } from '../firebaseClient';
import { RetroBackground } from '../components/RetroBackground';
import { RetroCard, RetroTitle, RetroButton, NeonColors } from '../components/RetroUI';

interface ScoreEntry {
  id: string;
  email: string;
  score: number;
  createdAt: any;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Construim cererea: Doar Crazy Mode, ordonat după scor, primii 20
    const q = query(
      collection(db, "scores"),
      where("game", "==", "crazymode"),
      orderBy("score", "desc"),
      limit(20)
    );

    // 2. Ascultăm în TIMP REAL (onSnapshot)
    // De fiecare dată când cineva salvează un scor, această funcție rulează automat
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedScores: ScoreEntry[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScoreEntry));
      
      setScores(fetchedScores);
      setLoading(false);
    }, (error) => {
      console.error("Eroare la leaderboard:", error);
      // Notă: Dacă vezi eroare de index în consolă, Firebase îți va da un link să îl creezi automat.
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <RetroBackground>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', minHeight: '100vh' }}>
        
        <RetroCard color={NeonColors.RED} style={{ width: '100%', maxWidth: '600px' }}>
          <RetroTitle size="28px" color={NeonColors.RED}>TOP CRAZY PLAYERS</RetroTitle>
          <p style={{ color: '#aaa', fontSize: '10px', marginBottom: '30px' }}>
            HALL OF FAME - REAL TIME UPDATES
          </p>

          {loading ? (
            <p style={{ color: NeonColors.YELLOW, padding: '20px' }}>LOADING DATA...</p>
          ) : (
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Press Start 2P", monospace' }}>
                <thead>
                  <tr style={{ color: NeonColors.CYAN, borderBottom: `2px solid ${NeonColors.CYAN}` }}>
                    <th style={{ padding: '15px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>PLAYER</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#555' }}>
                        NICIUN SCOR ÎNCĂ. FII PRIMUL!
                      </td>
                    </tr>
                  ) : (
                    scores.map((entry, index) => (
                      <tr key={entry.id} style={{ 
                        color: index === 0 ? NeonColors.YELLOW : (index === 1 ? '#ccc' : (index === 2 ? '#cd7f32' : 'white')),
                        textShadow: index < 3 ? `0 0 10px ${index === 0 ? NeonColors.YELLOW : 'white'}` : 'none',
                        borderBottom: '1px solid #333'
                      }}>
                        <td style={{ padding: '15px', textAlign: 'left' }}>{index + 1}.</td>
                        <td style={{ padding: '15px', textAlign: 'left' }}>
                          {entry.email.split('@')[0].toUpperCase()}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'right', color: NeonColors.GREEN }}>
                          {entry.score}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '30px', borderTop: `1px solid ${NeonColors.RED}`, paddingTop: '20px' }}>
            <RetroButton variant="yellow" onClick={() => navigate('/dashboard')}>
              ÎNAPOI LA DASHBOARD
            </RetroButton>
          </div>

        </RetroCard>

      </div>
    </RetroBackground>
  );
};

export default Leaderboard;
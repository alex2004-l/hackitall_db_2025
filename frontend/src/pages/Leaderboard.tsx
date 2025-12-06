import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
// @ts-ignore
import { db } from '../firebaseClient';
import { RetroBackground } from '../components/RetroBackground';
import { RetroCard, RetroTitle, RetroButton, NeonColors } from '../components/RetroUI';

interface ScoreEntry {
  id: string;
  email?: string;
  username?: string;
  score: number;
  game?: string;
  uid?: string; // Avem nevoie de UID pentru a identifica unicitatea
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        // 1. Cerem mai multe date (100) ca să avem de unde filtra duplicatele
        const q = query(
          collection(db, "scores"),
          where("game", "==", "crazymode"),
          orderBy("score", "desc"),
          limit(100) 
        );

        const snapshot = await getDocs(q);
        
        // --- LOGICĂ FILTRARE UNICĂ & MAXIM ---
        const uniqueScores: ScoreEntry[] = [];
        const seenUsers = new Set<string>(); // Set pentru a ține minte cine a fost adăugat

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const userId = data.uid || data.email; // Identificator unic
          
          // A. Determinăm Numele pentru a verifica dacă e Unknown
          let displayName = "";
          if (data.username && data.username.trim() !== "") displayName = data.username;
          else if (data.email) displayName = data.email.split('@')[0];
          
          // B. FILTRU 1: Eliminăm "Unknown" / "Anonymous"
          if (!displayName || 
              displayName.toLowerCase().includes("unknown") || 
              displayName.toLowerCase().includes("anon")) {
            return; // Sărim peste acest scor
          }

          // C. FILTRU 2: Verificăm dacă utilizatorul există deja
          // Deoarece query-ul e sortat descrescător, primul scor găsit pentru un user e automat cel MAXIM
          if (seenUsers.has(userId)) {
            return; // Sărim peste scorurile mai mici ale aceluiași om
          }

          // D. Dacă trece filtrele, îl adăugăm
          seenUsers.add(userId);
          uniqueScores.push({
            id: doc.id,
            email: data.email,
            username: data.username,
            score: typeof data.score === 'number' ? data.score : 0,
            game: data.game,
            uid: data.uid
          });
        });
        
        // Tăiem lista finală la top 20 după filtrare
        setScores(uniqueScores.slice(0, 20));

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
    };

    fetchScores();
  }, []);

  const formatName = (entry: ScoreEntry) => {
    if (entry.username && entry.username.trim() !== "") return entry.username;
    if (entry.email) return entry.email.split('@')[0];
    return "PLAYER";
  };

  return (
    <RetroBackground>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', minHeight: '100vh', position: 'relative', zIndex: 20 }}>
        
        <RetroCard color={NeonColors.RED} style={{ width: '100%', maxWidth: '600px', padding: '30px', backgroundColor: '#050505', boxShadow: `0 0 30px ${NeonColors.RED}` }}>
          
          <RetroTitle size="24px" color={NeonColors.RED}>CRAZY MODE CHAMPIONS</RetroTitle>
          <p style={{ color: '#aaa', fontSize: '10px', marginBottom: '30px', textTransform: 'uppercase' }}>
            BEST SCORE PER PLAYER (TOP 20)
          </p>

          {errorMsg ? (
             <div style={{ color: NeonColors.RED, textAlign: 'center', margin: '20px 0', border: '1px solid red', padding: '10px' }}>
                ⚠️ {errorMsg}
             </div>
          ) : loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: NeonColors.YELLOW, animation: 'blink 1s infinite' }}>
              LOADING DATA...
            </div>
          ) : (
            <div style={{ maxHeight: '60vh', overflowY: 'auto', border: `2px solid ${NeonColors.RED}`, padding: '10px', backgroundColor: '#000' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#111', zIndex: 5 }}>
                  <tr style={{ color: NeonColors.RED, borderBottom: `2px solid ${NeonColors.RED}` }}>
                    <th style={{ padding: '15px 5px', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '15px 5px', textAlign: 'left' }}>PLAYER</th>
                    <th style={{ padding: '15px 5px', textAlign: 'right' }}>BEST</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                        NICIUN RECORD VALID GĂSIT.
                      </td>
                    </tr>
                  ) : (
                    scores.map((entry, index) => {
                      let rowColor = 'white';
                      if (index === 0) rowColor = NeonColors.YELLOW;
                      else if (index === 1) rowColor = '#c0c0c0';
                      else if (index === 2) rowColor = '#cd7f32';

                      return (
                        <tr key={entry.id} style={{ color: rowColor, borderBottom: '1px solid #222', backgroundColor: index % 2 === 0 ? '#0a0a0a' : '#000' }}>
                          <td style={{ padding: '15px 5px', textAlign: 'center' }}>{index + 1}.</td>
                          <td style={{ padding: '15px 5px', textAlign: 'left' }}>
                            {formatName(entry).toUpperCase()}
                          </td>
                          <td style={{ padding: '15px 5px', textAlign: 'right', color: NeonColors.GREEN }}>
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

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <RetroButton variant="yellow" onClick={() => navigate('/dashboard')} style={{ maxWidth: '200px' }}>ÎNAPOI</RetroButton>
            <RetroButton variant="green" onClick={() => window.location.reload()} style={{ maxWidth: '200px' }}>REFRESH</RetroButton>
          </div>

        </RetroCard>
      </div>
    </RetroBackground>
  );
};

export default Leaderboard;
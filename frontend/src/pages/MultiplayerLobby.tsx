import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseClient';
import { RetroBackground } from '../components/RetroBackground';
import { RetroCard, RetroButton, RetroTitle, NeonColors } from '../components/RetroUI';

const MultiplayerLobby = () => {
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState('');
  
  // create room
  const createRoom = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // add room
    const roomRef = await addDoc(collection(db, "rooms"), {
      status: 'waiting',
      createdAt: new Date(),
      player1: {
        uid: user.uid,
        email: user.email,
        snake: [{x: 5, y: 5}, {x: 4, y: 5}], 
        score: 0
      },
      // player 2 is null
      player2: null 
    });

    navigate(`/game/snake-multi/${roomRef.id}?role=host`);
  };

  // join room
  const joinRoom = async () => {
    const user = auth.currentUser;
    if (!user || !roomIdInput) return;

    const roomRef = doc(db, "rooms", roomIdInput);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists() && roomSnap.data().status === 'waiting') {
      // player 2 joins
      await updateDoc(roomRef, {
        status: 'playing',
        player2: {
          uid: user.uid,
          email: user.email,
          snake: [{x: 20, y: 20}, {x: 21, y: 20}], 
          score: 0
        }
      });
      navigate(`/game/snake-multi/${roomIdInput}?role=guest`);
    }
  };

  return (
    <RetroBackground>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <RetroCard color={NeonColors.CYAN} style={{ width: '400px', textAlign: 'center' }}>
          <RetroTitle size="20px">MULTIPLAYER LOBBY</RetroTitle>
          
          <RetroButton variant="cyan" onClick={createRoom}>
            CREATE A ROOM
          </RetroButton>

          <hr style={{ borderColor: NeonColors.CYAN, margin: '20px 0', opacity: 0.5 }} />

          <p style={{ color: '#fff', fontSize: '10px' }}>ADD CODE FOR AN EXISTING ROOM:</p>
          <input 
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            placeholder="Enter Room ID..."
            style={{ padding: '10px', width: '80%', background: '#000', color: '#fff', border: '1px solid cyan', fontFamily: 'inherit', marginBottom: '10px' }}
          />
          <RetroButton variant="pink" onClick={joinRoom}>
            JOIN GAME
          </RetroButton>
          
          <div style={{marginTop: 20}}>
            <RetroButton variant="yellow" onClick={() => navigate('/dashboard')}>BACK</RetroButton>
          </div>
        </RetroCard>
      </div>
    </RetroBackground>
  );
};

export default MultiplayerLobby;

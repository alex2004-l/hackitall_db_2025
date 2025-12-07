import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseClient';
import { RetroBackground } from '../components/RetroBackground';
import { RetroCard, RetroButton, RetroTitle, NeonColors } from '../components/RetroUI';

const MultiplayerLobby = () => {
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState('');
  
  // 1. CREARE CAMERĂ
  const createRoom = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Inițializăm camera
    const roomRef = await addDoc(collection(db, "rooms"), {
      status: 'waiting',
      createdAt: new Date(),
      player1: {
        uid: user.uid,
        email: user.email,
        snake: [{x: 5, y: 5}, {x: 4, y: 5}], // Poziții start
        score: 0
      },
      // Player 2 e null momentan
      player2: null 
    });

    // Mergem în joc cu ID-ul camerei și rolul de 'host'
    navigate(`/game/snake-multi/${roomRef.id}?role=host`);
  };

  // 2. JOIN CAMERĂ
  const joinRoom = async () => {
    const user = auth.currentUser;
    if (!user || !roomIdInput) return;

    const roomRef = doc(db, "rooms", roomIdInput);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists() && roomSnap.data().status === 'waiting') {
      // Intrăm ca Player 2
      await updateDoc(roomRef, {
        status: 'playing', // Începe jocul!
        player2: {
          uid: user.uid,
          email: user.email,
          snake: [{x: 20, y: 20}, {x: 21, y: 20}], // Start opus
          score: 0
        }
      });
      navigate(`/game/snake-multi/${roomIdInput}?role=guest`);
    } else {
      alert("Camera nu există sau e plină!");
    }
  };

  return (
    <RetroBackground>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <RetroCard color={NeonColors.CYAN} style={{ width: '400px', textAlign: 'center' }}>
          <RetroTitle size="20px">MULTIPLAYER LOBBY</RetroTitle>
          
          <RetroButton variant="cyan" onClick={createRoom}>
            CREEAZĂ CAMERĂ NOUĂ
          </RetroButton>

          <hr style={{ borderColor: NeonColors.CYAN, margin: '20px 0', opacity: 0.5 }} />

          <p style={{ color: '#fff', fontSize: '10px' }}>SAU INTRĂ ÎN UNA EXISTENTĂ:</p>
          <input 
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            placeholder="Introdu ID Cameră..."
            style={{ padding: '10px', width: '80%', background: '#000', color: '#fff', border: '1px solid cyan', fontFamily: 'inherit', marginBottom: '10px' }}
          />
          <RetroButton variant="pink" onClick={joinRoom}>
            JOIN GAME
          </RetroButton>
          
          <div style={{marginTop: 20}}>
            <RetroButton variant="yellow" onClick={() => navigate('/dashboard')}>ÎNAPOI</RetroButton>
          </div>
        </RetroCard>
      </div>
    </RetroBackground>
  );
};

export default MultiplayerLobby;
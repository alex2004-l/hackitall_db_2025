import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
// @ts-ignore
import { db } from '../firebaseClient';
import { RetroBackground } from '../components/RetroBackground';
import { RetroCard, RetroTitle, RetroButton, NeonColors } from '../components/RetroUI';

const API_BASE_URL = "http://localhost:5000"; 

const PublicProfile = () => {
  const { uid } = useParams(); 
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!uid) return;
      try {
        const docRef = doc(db, "User", uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [uid]);

  const getImgUrl = () => {
    if (!userData?.profilePictureUrl) return null;
    return userData.profilePictureUrl.startsWith('http') 
      ? userData.profilePictureUrl 
      : `${API_BASE_URL}${userData.profilePictureUrl}`;
  };

  return (
    <RetroBackground>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <RetroCard color={NeonColors.CYAN} style={{ width: '400px', textAlign: 'center', padding: '30px' }}>
          
          <RetroTitle size="20px">PLAYER CARD</RetroTitle>

          {loading ? (
            <p style={{ color: NeonColors.YELLOW }}>SCANNING...</p>
          ) : userData ? (
            <>
              <div style={{ 
                width: '120px', height: '120px', margin: '0 auto 20px',
                border: `4px solid ${NeonColors.PINK}`, borderRadius: '50%',
                overflow: 'hidden', backgroundColor: '#000',
                boxShadow: `0 0 15px ${NeonColors.PINK}`
              }}>
                <img 
                  src={getImgUrl() || "https://via.placeholder.com/150"} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
                />
              </div>

              {/* Username */}
              <h2 style={{ color: NeonColors.GREEN, textShadow: `0 0 10px ${NeonColors.GREEN}`, marginBottom: '10px' }}>
                {userData.username || "UNKNOWN PLAYER"}
              </h2>
              
              <p style={{ color: '#aaa', fontSize: '10px' }}>ID: {uid?.slice(0,8)}...</p>
            </>
          ) : (
            <p style={{ color: NeonColors.RED }}>USER NOT FOUND</p>
          )}

          <div style={{ marginTop: '30px' }}>
            <RetroButton variant="yellow" onClick={() => navigate(-1)}>ÎNAPOI</RetroButton>
          </div>

        </RetroCard>
      </div>
    </RetroBackground>
  );
};

export default PublicProfile;
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { auth } from "./../firebaseClient";
import { RetroBackground } from "../components/RetroBackground";
import { RetroButton, NeonColors } from "../components/RetroUI";

const API_BASE_URL = "http://localhost:5000";

interface ProfileData {
  username: string;
  profilePictureUrl: string;
}

const NEON = "#00ff66";
const ACCENT = "#ff33cc";
// NOTE: Make sure this path exists in your Flask static folders for the default image!
const DEFAULT_PICTURE = "/static/system_defaults/user.jpg"; 

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>({ username: "", profilePictureUrl: "" });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [authStatus, setAuthStatus] = useState({
    user: auth.currentUser as (typeof auth.currentUser) | null,
    resolved: false,
    message: null as string | null,
  });

  const isLoggedIn = !!authStatus.user;

  const setTimedStatus = useCallback((msg: string, isError: boolean = false) => {
    setAuthStatus(prev => ({ ...prev, message: msg }));
    setTimeout(() => setAuthStatus(prev => ({ ...prev, message: null })), 3000);
    if (isError) console.error(`[ERROR] ${msg}`);
    else console.log(msg);
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setAuthStatus(prev => ({ ...prev, user: currentUser, resolved: true }));
      setLoading(!!currentUser);
    });
    return unsubscribe;
  }, []);

  // Fetch profile from backend
  const fetchProfile = useCallback(async (user: typeof auth.currentUser) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Backend fetch failed.");
      const data: ProfileData = await response.json();
      setProfile(data);
      setNewUsername(data.username);
    } catch (error) {
      setTimedStatus(`Loading profile failed: ${error}`, true);
    } finally {
      setLoading(false);
    }
  }, [setTimedStatus]);

  useEffect(() => {
    if (authStatus.resolved && authStatus.user) fetchProfile(authStatus.user);
  }, [authStatus.resolved, authStatus.user, fetchProfile]);

  // Update username
  const handleUpdateUsername = async () => {
    const user = authStatus.user;
    if (!user || newUsername.trim() === "" || newUsername === profile.username) {
      setIsEditing(false);
      return;
    }
    try {
      const token = await user.getIdToken();
      setTimedStatus("Updating username...");
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      if (!response.ok) throw new Error("Backend update failed.");
      setProfile(prev => ({ ...prev, username: newUsername.trim() }));
      setIsEditing(false);
      setTimedStatus("Username updated successfully!");
    } catch (error) {
      setTimedStatus(`Username update failed: ${error}`, true);
    }
  };

  // Upload profile picture (backend pixelates)
  const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const user = authStatus.user;
    if (!file || !user) return;

    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      setTimedStatus("Uploading picture...");
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/profile/picture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server error");
      }
      const data: { profilePictureUrl: string } = await response.json();
      setProfile(prev => ({ ...prev, profilePictureUrl: data.profilePictureUrl }));
      setTimedStatus("Profile picture updated!");
    } catch (error) {
      setTimedStatus(`Picture update failed: ${error}`, true);
    }
  };

  // --- Image URL Calculation ---
  const fullImageUrl = profile.profilePictureUrl
    ? API_BASE_URL + profile.profilePictureUrl
    : API_BASE_URL + DEFAULT_PICTURE; // Ensure the default image is also loaded from Flask

  if (!authStatus.resolved || loading) {
    return (
      <RetroBackground>
        <div style={{ padding: '2rem', textAlign: 'center', color: NEON, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: '"Press Start 2P", monospace' }}>
          <h2>LOADING PROFILE...</h2>
        </div>
      </RetroBackground>
    );
  }

  if (!isLoggedIn) {
    return (
      <RetroBackground>
        <div style={{ padding: '2rem', textAlign: 'center', color: ACCENT, fontFamily: '"Press Start 2P", monospace' }}>
          <h2 style={{ textShadow: `0 0 10px ${ACCENT}` }}>ACCESS DENIED</h2>
          <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>LOG IN REQUIRED.</p>
        </div>
      </RetroBackground>
    );
  }

  return (
    <RetroBackground>
      <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto', textAlign: 'center', fontFamily: '"Press Start 2P", monospace', color: NEON, minHeight: '100vh' }}>
        <h1 style={{ fontSize: '2rem', textShadow: `0 0 10px ${NEON}`, marginBottom: '2rem' }}>PLAYER PROFILE</h1>
        {authStatus.message && <p style={{ color: authStatus.message.includes("[ERROR]") ? '#ff0000' : '#00ff00', marginBottom: '1rem', fontSize: '0.8rem', textShadow: authStatus.message.includes("[ERROR]") ? `0 0 5px #ff0000` : `0 0 5px #00ff00` }}>{authStatus.message}</p>}

        {/* --- MODIFIED PROFILE PICTURE CONTAINER (Retro Box Frame) --- */}
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1rem', 
          border: `3px solid ${NEON}`, 
          boxShadow: `0 0 16px ${NEON}`, 
          borderRadius: '8px', // Square corners for the outer box frame
          backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slightly dark background
          display: 'inline-block', // Ensures the container fits the image area
          position: 'relative'
        }}>
          <img
            src={fullImageUrl}
            alt="Profile"
            style={{
              width: '350px', // Set a fixed size for the display area
              height: '350px',
              borderRadius: '50%', // Makes the image circular
              objectFit: 'cover',
              border: `5px solid ${ACCENT}`, 
              boxShadow: `0 0 10px ${ACCENT}`,
              imageRendering: 'pixelated',
              alignContent: 'left',
            }}
          />
          <br />
          <label htmlFor="picture-upload" style={{ cursor: 'pointer', display: 'block', marginTop: '1rem', color: ACCENT, fontWeight: 'bold', fontSize: '0.8rem', textShadow: `0 0 5px ${ACCENT}` }}>
            📸 CHANGE PROFILE PICTURE
          </label>
          <input id="picture-upload" type="file" accept="image/*" onChange={handlePictureUpload} style={{ display: 'none' }} />
        </div>
        {/* --- END MODIFIED PICTURE CONTAINER --- */}

        {/* Username */}
        <div style={{ padding: '1rem', border: `3px solid ${NEON}`, boxShadow: `0 0 16px ${NEON}`, borderRadius: '8px', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>PLAYER USERNAME</h3>
          {isEditing ? (
            <>
              <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} maxLength={50} style={{ padding: '8px', fontSize: '1rem', marginRight: '10px', fontFamily: '"Press Start 2P", monospace', borderRadius: '4px', border: `2px solid ${NEON}`, backgroundColor: '#000', color: NEON }} />
              <RetroButton variant="cyan" onClick={handleUpdateUsername} style={{ marginRight: '5px' }}>SAVE</RetroButton>
              <RetroButton variant="pink" onClick={() => { setIsEditing(false); setNewUsername(profile.username); }}>CANCEL</RetroButton>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: ACCENT, textShadow: `0 0 5px ${ACCENT}` }}>{profile.username}</span>
              <RetroButton variant="cyan" onClick={() => setIsEditing(true)} style={{ marginLeft: '10px' }}>EDIT</RetroButton>
            </>
          )}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <RetroButton variant="yellow" onClick={() => navigate('/dashboard')} style={{ maxWidth: '200px' }}>DASHBOARD</RetroButton>
          <RetroButton variant="red" onClick={() => auth.signOut()} style={{ maxWidth: '200px' }}>LOGOUT</RetroButton>
        </div>
      </div>
    </RetroBackground>
  );
};

export default Profile;
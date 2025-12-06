import React, { useState, useEffect, useCallback } from "react";
// REMOVE: import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "./../firebaseClient"; // Only need auth, storage is removed

const API_BASE_URL = "http://localhost:5000";
const NEON = "#00ff66";
const ACCENT = "#ff33cc";

interface ProfileData {
  username: string;
  profilePictureUrl: string; // This will now store the local path (e.g., /static/user_uploads/...)
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData>({ username: "", profilePictureUrl: "" });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  
  // Unified state for auth and status messages
  const [authStatus, setAuthStatus] = useState({
    user: auth.currentUser as (typeof auth.currentUser) | null, 
    resolved: false,
    message: null as string | null,
  });

  const isLoggedIn = !!authStatus.user;
  
  // --- UTILITY: Set Status Message ---
  const setTimedStatus = useCallback((msg: string, isError: boolean = false) => {
    setAuthStatus(prev => ({ ...prev, message: msg }));
    setTimeout(() => setAuthStatus(prev => ({ ...prev, message: null })), 3000);
    if (isError) console.error(`[ERROR] ${msg}`);
    else console.log(msg);
  }, []);

  // --- 1. AUTH LISTENER (CRITICAL) ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setAuthStatus(prev => ({ ...prev, user: currentUser, resolved: true }));
      setLoading(!!currentUser); 
    });
    return unsubscribe;
  }, []);

  // --- 2. PROFILE INITIALIZATION (Flask must handle POST to /profile/init) ---
  const initProfile = useCallback(async (user: typeof auth.currentUser) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`${API_BASE_URL}/profile/init`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.warn("Profile init (non-blocking) failed.");
    }
  }, []);

  // --- 3. FETCH PROFILE DATA ---
  const fetchProfile = useCallback(async (user: typeof auth.currentUser) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      await initProfile(user); 

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
  }, [initProfile, setTimedStatus]);

  useEffect(() => {
    if (authStatus.resolved && authStatus.user) {
      fetchProfile(authStatus.user);
    }
  }, [authStatus.resolved, authStatus.user, fetchProfile]);

  // --- 4. HANDLE USERNAME UPDATE (PUT to /profile) ---
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
      setTimedStatus("Username updated successfully!", false);
    } catch (error) {
      setTimedStatus(`Username update failed: ${error}`, true);
    }
  };

  // --- 5. HANDLE PICTURE UPLOAD (File -> Flask API) ---
  const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const user = authStatus.user;
    if (!file || !user) return;

    // Use FormData to send the file directly to Flask
    const formData = new FormData();
    formData.append("profilePicture", file);
    
    try {
        setTimedStatus("Uploading picture to local server...");
        const token = await user.getIdToken();
        
        // 1. Send file data to the NEW Flask API endpoint
        const response = await fetch(`${API_BASE_URL}/profile/picture`, {
            method: "POST", // POST is standard for file uploads
            headers: {
                Authorization: `Bearer ${token}`,
                // DO NOT set 'Content-Type': The browser handles it for FormData
            },
            body: formData, // Send the file data
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Upload failed: ${errorData.error || 'Server error'}`);
        }
        
        // 2. Flask returns the new local URL (e.g., /static/user_uploads/abc.jpg)
        const data: { profilePictureUrl: string } = await response.json();

        // 3. Update local state with the new local URL
        setProfile(prev => ({ ...prev, profilePictureUrl: data.profilePictureUrl }));
        setTimedStatus("Profile picture updated successfully!", false);
        
    } catch (error) {
        setTimedStatus(`Picture update failed: ${error}`, true);
    }
  };


  // --- Render Logic ---

  if (!authStatus.resolved) {
    return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: '"Press Start 2P", monospace', color: NEON, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <h2>AUTH CHECK...</h2>
        </div>
    );
  }

  if (!isLoggedIn) {
      return (
          <div style={{ padding: '2rem', textAlign: 'center', fontFamily: '"Press Start 2P", monospace', color: ACCENT }}>
              <h2 style={{ textShadow: `0 0 10px ${ACCENT}` }}>ACCESS DENIED</h2>
              <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>LOG IN REQUIRED.</p>
          </div>
      );
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: '"Press Start 2P", monospace', color: NEON }}>Loading Data...</div>;
  }

  const defaultPicture = "/static/system_default/user.jpg";  
  // CRITICAL FIX: Calculate the full, fetchable URL for the image
  const fullImageUrl = profile.profilePictureUrl
    ? API_BASE_URL + profile.profilePictureUrl
    : defaultPicture;

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto', textAlign: 'center', fontFamily: '"Press Start 2P", monospace', color: NEON, minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', textShadow: `0 0 10px ${NEON}`, marginBottom: '2rem' }}>PLAYER PROFILE</h1>
      
      {authStatus.message && (
        <p style={{ 
            color: authStatus.message.includes("[ERROR]") ? '#ff0000' : '#00ff00', 
            marginBottom: '1rem', 
            fontSize: '0.8rem',
            textShadow: authStatus.message.includes("[ERROR]") ? `0 0 5px #ff0000` : `0 0 5px #00ff00`
        }}>
            {authStatus.message}
        </p>
      )}

      {/* Profile Picture Section */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: `3px solid ${NEON}`, boxShadow: `0 0 16px ${NEON}`, borderRadius: '8px' }}>
        <img 
          // --- APPLYING THE FIXED URL ---
          src={fullImageUrl} 
          alt="Profile" 
          style={{ 
            width: '150px', 
            height: '150px', 
            borderRadius: '8px',
            objectFit: 'cover', 
            border: `3px solid ${NEON}`,
            boxShadow: `0 0 12px ${ACCENT}`,
            marginBottom: '1rem'
          }} 
        />
        <br />
        <label htmlFor="picture-upload" style={{ cursor: 'pointer', display: 'block', marginTop: '1rem', color: ACCENT, fontWeight: 'bold', fontSize: '0.8rem', textShadow: `0 0 5px ${ACCENT}` }}>
          📸 CHANGE PROFILE PICTURE
        </label>
        <input 
          id="picture-upload" 
          type="file" 
          accept="image/*" 
          onChange={handlePictureUpload} 
          style={{ display: 'none' }}
        />
      </div>
      
      {/* Username Section */}
      <div style={{ padding: '1rem', border: `3px solid ${NEON}`, boxShadow: `0 0 16px ${NEON}`, borderRadius: '8px', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>PLAYER USERNAME</h3>
        {isEditing ? (
          <>
            <input 
              type="text" 
              value={newUsername} 
              onChange={(e) => setNewUsername(e.target.value)} 
              maxLength={50}
              style={{ padding: '8px', fontSize: '1rem', marginRight: '10px', fontFamily: '"Press Start 2P", monospace', borderRadius: '4px', border: `2px solid ${NEON}`, backgroundColor: '#000', color: NEON }}
            />
            <button onClick={handleUpdateUsername} style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: 'transparent', border: `2px solid ${NEON}`, color: NEON, fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem', marginRight: '5px', boxShadow: `0 0 8px ${NEON}` }}>
              SAVE
            </button>
            <button onClick={() => { setIsEditing(false); setNewUsername(profile.username); }} style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: 'transparent', border: `2px solid ${ACCENT}`, color: ACCENT, fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem', boxShadow: `0 0 8px ${ACCENT}` }}>
              CANCEL
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: ACCENT, textShadow: `0 0 5px ${ACCENT}` }}>{profile.username}</span>
            <button onClick={() => setIsEditing(true)} style={{ marginLeft: '10px', padding: '8px 15px', cursor: 'pointer', backgroundColor: 'transparent', border: `2px solid ${NEON}`, color: NEON, fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem', boxShadow: `0 0 8px ${NEON}` }}>
              EDIT
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
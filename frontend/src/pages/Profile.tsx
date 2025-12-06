// Profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "./../firebaseClient";

const API_BASE_URL = "http://localhost:5000"; // Use your Flask URL

interface ProfileData {
  name: string;
  profilePictureUrl: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData>({ name: "", profilePictureUrl: "" });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  
  // Check login status early
  const user = auth.currentUser;
  const isLoggedIn = !!user;

  // --- 1. Fetch Profile Data (Requires Auth) ---
  const fetchProfile = useCallback(async () => {
    if (!isLoggedIn) {
      setStatus("Error: You must be logged in to view your profile.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      // Accessing the secure Flask endpoint
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`, // Sending the necessary Firebase ID token
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile from backend.");
      }

      const data: ProfileData = await response.json();
      setProfile(data);
      setNewName(data.name); 
      setStatus(null);
    } catch (error) {
      console.error("Fetch profile error:", error);
      setStatus("Could not load profile data. Please try logging in again.");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // --- 2. Handle Name Update ---
  const handleUpdateName = async () => {
    if (!isLoggedIn || newName.trim() === "" || newName === profile.name) {
      setIsEditing(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      setStatus("Updating name...");
      
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update name.");
      }

      setProfile(prev => ({ ...prev, name: newName.trim() }));
      setIsEditing(false);
      setStatus("Name updated successfully!");
    } catch (error) {
      console.error("Update name error:", error);
      setStatus("Failed to update name.");
    }
  };

  // --- 3. Handle Picture Upload (Firebase Storage -> Flask API) ---
  const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isLoggedIn) return;

    try {
        setStatus("Uploading picture to Firebase Storage...");
        
        // Use the user's UID to create a unique path in storage
        const storageRef = ref(storage, `user_images/${user.uid}/profile-picture`);

        // 1. Upload the file to Storage
        const snapshot = await uploadBytes(storageRef, file);

        // 2. Get the public downloadable URL
        const publicUrl = await getDownloadURL(snapshot.ref);
        
        setStatus("Image uploaded successfully. Sending URL to backend...");

        // 3. Send the URL to the secure Flask API
        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ profilePictureUrl: publicUrl }), // Send the URL
        });

        if (!response.ok) {
            throw new Error("Failed to update profile picture URL.");
        }

        // 4. Update local state
        setProfile(prev => ({ ...prev, profilePictureUrl: publicUrl }));
        setStatus("Profile picture updated!");
    } catch (error) {
        console.error("Profile picture update error:", error);
        setStatus(`Failed to update picture: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // --- Render Logic ---
  if (!isLoggedIn) {
      return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
              <h2>🔒 Access Denied</h2>
              <p>Please log in to view your profile and settings.</p>
          </div>
      );
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Player Profile...</div>;
  }

  const defaultPicture = "https://via.placeholder.com/150/0000FF/FFFFFF?text=ARCADE";
  
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', textAlign: 'center' }}>
      <h2>Your Player Profile 🕹️</h2>
      {status && <p style={{ color: status.includes("Failed") || status.includes("Error") ? 'red' : 'green' }}>{status}</p>}

      <div style={{ marginBottom: '20px' }}>
        <img 
          src={profile.profilePictureUrl || defaultPicture} 
          alt="Profile" 
          style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid gold' }} 
        />
        <br />
        <label htmlFor="picture-upload" style={{ cursor: 'pointer', display: 'block', marginTop: '10px', color: 'blue', fontWeight: 'bold' }}>
          Change Profile Picture
        </label>
        <input 
          id="picture-upload" 
          type="file" 
          accept="image/*" 
          onChange={handlePictureUpload} 
          style={{ display: 'none' }}
        />
      </div>
      
      <div>
        <h3>Player Name:</h3>
        {isEditing ? (
          <>
            <input 
              type="text" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              maxLength={50}
              style={{ padding: '8px', fontSize: '1.2em', marginRight: '10px' }}
            />
            <button onClick={handleUpdateName} style={{ padding: '8px 15px', cursor: 'pointer' }}>
              Save Name
            </button>
            <button onClick={() => { setIsEditing(false); setNewName(profile.name); }} style={{ padding: '8px 15px', marginLeft: '5px', cursor: 'pointer' }}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{profile.name}</span>
            <button onClick={() => setIsEditing(true)} style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}>
              Edit
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default Profile;

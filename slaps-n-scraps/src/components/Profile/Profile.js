import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { firestore } from '../backend/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import './Profile.css';

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { openUserProfile } = useClerk();
  const { username } = useParams(); // the profile being viewed
  const [loading, setLoading] = useState(true);

  // User profile state
  const [profileData, setProfileData] = useState({
    username: '',
    fullName: '',
    imageUrl: '',
    bio: '',
    topFiveArtists: []
  });

  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [artistResults, setArtistResults] = useState([]);
  const inputRef = useRef(null);
  const maxLength = 1000;

  const isOwnProfile = user?.username === username;

  useEffect(() => {
    const uaWrapper = document.querySelector('.ua-wrapper');
    if (uaWrapper) uaWrapper.style.display = 'none';
  
    return () => {
      if (uaWrapper) uaWrapper.style.display = '';
    };
  }, []);

  useEffect(() => {
    if (!user) return;
  
    const syncClerkProfile = async () => {
      try {
        const userDocRef = doc(firestore, 'users', user.username);
        const docSnap = await getDoc(userDocRef);
        const existingData = docSnap.exists() ? docSnap.data() : {};
  
        await setDoc(
          userDocRef,
          {
            ...existingData, // keep bio, topFiveArtists, and any other existing fields
            username: user.username,
            fullName: user.fullName || '',
            imageUrl: user.imageUrl || '',
            email: user.primaryEmailAddress?.emailAddress || '',
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Error syncing Clerk profile to Firestore:', err);
      }
    };
  
    syncClerkProfile();
  }, [user]);  

  // Load user profile from Firestore
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const userDocRef = doc(firestore, 'users', username);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            username: data.username || username,
            fullName: data.fullName || '',
            imageUrl: data.imageUrl || '',
            bio: data.bio || '',
            topFiveArtists: data.topFiveArtists || []
          });
          setBio(data.bio || '');
          if (isOwnProfile && !data.bio) setEditing(true);
        } else {
          // User doc doesn't exist
          setProfileData({
            username,
            fullName: '',
            imageUrl: '',
            bio: '',
            topFiveArtists: []
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [username, isOwnProfile, user]);

  // Spotify search
  useEffect(() => {
    if (!isOwnProfile) return;

    const runSearch = async () => {
      if (searchQuery.trim() === '') {
        setArtistResults([]);
        return;
      }
      const token = await getSpotifyToken();
      if (!token) return;
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=artist&limit=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        setArtistResults(data.artists?.items || []);
      } catch (err) {
        console.error('Spotify search error:', err);
      }
    };
    const debounce = setTimeout(runSearch, 350);
    return () => clearTimeout(debounce);
  }, [searchQuery, isOwnProfile]);

  // Add artist to Top Five
  const handleArtistSelect = async (artist) => {
    if (!isOwnProfile || profileData.topFiveArtists.length >= 5) return;

    const newArtist = {
      id: artist.id,
      name: artist.name,
      image: artist.images?.[0]?.url || null,
    };

    const userDocRef = doc(firestore, 'users', user.username);
    await updateDoc(userDocRef, { topFiveArtists: arrayUnion(newArtist) });

    setProfileData((prev) => ({
      ...prev,
      topFiveArtists: [...prev.topFiveArtists, newArtist]
    }));
    setSearchQuery('');
    setArtistResults([]);
  };

  // Remove artist
  const handleRemoveArtist = async (artist) => {
    if (!isOwnProfile) return;

    const userDocRef = doc(firestore, 'users', user.username);
    await updateDoc(userDocRef, { topFiveArtists: arrayRemove(artist) });

    setProfileData((prev) => ({
      ...prev,
      topFiveArtists: prev.topFiveArtists.filter((a) => a.id !== artist.id)
    }));
  };

  // Save bio
  const handleSaveBio = async () => {
    if (!isOwnProfile) return;

    const userDocRef = doc(firestore, 'users', user.username);
    await updateDoc(userDocRef, { bio });
    setProfileData((prev) => ({ ...prev, bio }));
    setEditing(false);
  };

  const handleBioChange = (e) => {
    if (e.target.value.length <= maxLength) setBio(e.target.value);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleManageAccount = () => openUserProfile();

  if (loading) {
    return (
      <div className="profileLoadingContainer">
        <p className="profileLoadingText">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="profileContainer">
      {/* LEFT HALF */}
      <div className="profileLeft">
        <img src={profileData.imageUrl} alt={profileData.fullName} className="profileAvatar" />
        <h2 className="profileTitle">
          {isOwnProfile
            ? <>Welcome, <span>{profileData.fullName || profileData.username}</span></>
            : <>Welcome to <span>{profileData.username}'s</span> profile</>
          }
        </h2>

        <div className="profileBioBox">
          {editing && isOwnProfile ? (
            <>
              <textarea
                className="profileBioTextarea"
                placeholder="Write your bio here..."
                value={bio}
                onChange={handleBioChange}
                autoFocus
              />
              <div className="bioControls">
                <span className="bioCharCount">{bio.length}/{maxLength}</span>
                <button className="profileSaveBioButton" onClick={handleSaveBio}>
                  Save Bio
                </button>
              </div>
            </>
          ) : (
            <div className={`profileBioDisplay ${isOwnProfile ? 'editable' : ''}`} onClick={() => isOwnProfile && setEditing(true)}>
              <div className="bioText">{profileData.bio || 'No bio yet.'}</div>
              {isOwnProfile && <div className="bioEditHint"><span>EDIT</span></div>}
            </div>
          )}
        </div>

        {isOwnProfile && (
          <div className="profileButtonRow">
            <button className="manage-btn" onClick={handleManageAccount}>Manage Account</button>
            <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
          </div>
        )}
      </div>

      {/* RIGHT HALF */}
      <div className={`profileRight ${isOwnProfile ? 'ownProfile' : ''}`}>
        <h2 className="upf-header">
          {isOwnProfile ? 'Your Top Five Artists' : `${profileData.username}'s Top Five Artists`}
        </h2>

      {/* Search Bar */}
      {isOwnProfile && profileData.topFiveArtists.length < 5 && (
        <div className="upf-searchBar">
          <input
            ref={inputRef}
            type="text"
            placeholder={profileData.topFiveArtists.length === 0 ? "Search for your favorites here..." : "Search artists..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: profileData.topFiveArtists.length === 0 ? '250px' : '0px' }}
            onFocus={() => {
              if (inputRef.current) inputRef.current.style.width = '250px';
            }}
            onBlur={() => {
              if (inputRef.current && profileData.topFiveArtists.length !== 0) inputRef.current.style.width = '0px';
            }}
            autoFocus={profileData.topFiveArtists.length === 0}
          />
          <button onClick={() => inputRef.current?.focus()}>
            <i className="fas fa-search"></i>
          </button>
        </div>
      )}

        {/* Search Results */}
        {artistResults.length > 0 && (
          <div className="upf-searchResults">
            {artistResults.map((artist) => (
              <div key={artist.id} className="upf-searchItem" onClick={() => handleArtistSelect(artist)}>
                <span>{artist.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Top Five */}
        <div className="upf-topFiveList">
          {profileData.topFiveArtists.length === 0 && !isOwnProfile && (
            <div className="upf-noArtistsMessage">{profileData.username} has not picked any artists yet</div>
          )}

          {profileData.topFiveArtists.map((artist) => (
            <div key={artist.id} className="upf-artistWrapper">
              <div className={`upf-artistCard ${isOwnProfile ? 'userProfile' : ''}`}>
                <img src={artist.image} alt={artist.name} />
                {isOwnProfile && (
                  <button className="upf-removeBtn" onClick={() => handleRemoveArtist(artist)}>✕</button>
                )}
              </div>
              <p className="upf-artistName">{artist.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;

async function getSpotifyToken() {
  const clientId = process.env.REACT_APP_CLIENT_ID;
  const clientSecret = process.env.REACT_APP_CLIENT_SECRET;
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  return data.access_token;
}
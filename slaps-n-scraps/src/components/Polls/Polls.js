import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { firestore } from '../backend/firebase';
import { collection, getDocs, addDoc, updateDoc, increment, query, where, writeBatch } from 'firebase/firestore';
import { useSwipeable } from 'react-swipeable';
import { useUser, useClerk } from '@clerk/clerk-react'; // <-- Clerk hooks
import axios from 'axios';
import './Polls.css';

// The main Polls component responsible for managing and displaying song polls.
const Polls = () => {
  // State variables to manage component state
  const [newReleases, setNewReleases] = useState([]);
  const [currentReleaseIndex, setCurrentReleaseIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [reachedEndOfList, setReachedEndOfList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddSongModalOpen, setAddSongModalOpen] = useState(false);
  const [userSubmittedSongs, setUserSubmittedSongs] = useState([]);
  const [votedOnAllSongs, setVotedOnAllSongs] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState('');

  const { user } = useUser(); // Clerk user
  // eslint-disable-next-line
  const { openSignIn, openSignUp, signOut } = useClerk(); // Clerk auth actions

  const handlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('left'),
    onSwipedRight: () => handleSwipe('right'),
    preventDefaultTouchmoveEvent: true, // Optional: Prevent default behavior on touchmove
    trackMouse: true, // Optional: Enable swipe detection for mouse events (for desktop)
  });

  // Function to delete outdated user-submitted songs from Firestore
  const deleteOutdatedUserSubmittedSongs = useCallback(async () => {
    try {
      const userSubmittedSongsCollection = collection(firestore, 'userSubmittedSongs');
      const userSubmittedSongsSnapshot = await getDocs(userSubmittedSongsCollection);

      const now = Date.now();
      const batch = writeBatch(firestore);

      // Iterate over user submitted songs and add outdated ones to the batch
      userSubmittedSongsSnapshot.forEach((doc) => {
        const songData = doc.data();
        const songTimestamp = songData.timestamp || 0;
        const weekInMillis = 7 * 24 * 60 * 60 * 1000;

        if (now - songTimestamp > weekInMillis) {
          batch.delete(doc.ref);
        }
      });

      // Commit the batched deletion
      await batch.commit();

    } catch (error) {
      console.error('Error deleting outdated user-submitted songs:', error);
    }
  }, []);

  // Function to fetch user-submitted songs from Firestore
  const fetchUserSubmittedSongs = useCallback(async () => {
    try {
      const userSubmittedSongsCollection = collection(firestore, 'userSubmittedSongs');
      const userSubmittedSongsSnapshot = await getDocs(userSubmittedSongsCollection);
      const userSongs = userSubmittedSongsSnapshot.docs.map((doc) => doc.data());
      setUserSubmittedSongs(userSongs);
    } catch (error) {
      console.error('Error fetching user-submitted songs:', error);
    }
  }, []); // Empty dependency array, indicating no external dependencies

  // Function to fetch new releases from Netlify function
  const fetchNewReleases = async () => {
    try {
      const response = await axios.get('/.netlify/functions/getNewReleases?limit=25');
      const data = response.data;

      // Map the data to match your component's expected structure
      const releases = data.albums.items.map((album) => ({
        id: album.id,
        title: album.name,
        artist: album.artists.map((a) => a.name).join(', '),
        coverImage: album.images[0]?.url || '',
        releaseDate: album.release_date,
        link: album.id, // album ID for linking
        isUserSubmitted: false,
      }));

      setIsLoading(false);
      return releases;
    } catch (error) {
      console.error('Error fetching new releases:', error);
      setIsLoading(false);
      return []; // Return empty array if error occurs
    }
  };

  // useEffect hook to fetch initial data and schedule periodic data updates
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Delete outdated user submitted songs
        await deleteOutdatedUserSubmittedSongs();

        // Fetch new releases
        const newReleasesData = await fetchNewReleases();
        setNewReleases(newReleasesData);

        // Fetch user submitted songs from Firestore
        await fetchUserSubmittedSongs();

        // Reset current index to 0 when fetching new data
        setCurrentReleaseIndex(0);
        setReachedEndOfList(false);
        setVotedOnAllSongs(false);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Schedule to fetch new releases every week
    const interval = setInterval(fetchData, 7 * 24 * 60 * 60 * 1000);

    // Cleanup intervals on component unmount
    return () => clearInterval(interval);
  }, [fetchUserSubmittedSongs, deleteOutdatedUserSubmittedSongs]);

  // useMemo hook to combine new releases and user submitted songs into a single array
  const allSongs = useMemo(() => [...newReleases, ...userSubmittedSongs], [newReleases, userSubmittedSongs]);

  // Function to handle swipe gestures and update song data in Firestore
  const handleSwipe = async (direction) => {
    if (!user) {
      openSignIn(); // Prompt user to sign in if not authenticated
      return;
    }

    if (!reachedEndOfList) {
      try {
        const currentRelease = allSongs[currentReleaseIndex];

        const songsCollection = collection(firestore, 'songs');
        const songQuery = query(
          songsCollection,
          where('title', '==', currentRelease.title),
          where('artist', '==', currentRelease.artist)
        );

        const querySnapshot = await getDocs(songQuery);

        if (!querySnapshot.empty) {
          // Song exists in the collection, update the document
          const songDocRef = querySnapshot.docs[0].ref;

          await updateDoc(songDocRef, {
            totalVotes: increment(1),
            likes: direction === 'right' ? increment(1) : increment(0),
            dislikes: direction === 'left' ? increment(1) : increment(0),
          });
        } else {
          // Song doesn't exist in the collection, add a new document
          await addDoc(songsCollection, {
            title: currentRelease.title,
            artist: currentRelease.artist,
            totalVotes: 1,
            likes: direction === 'right' ? 1 : 0,
            dislikes: direction === 'left' ? 1 : 0,
            coverImage: currentRelease.coverImage,
            link: currentRelease.isUserSubmitted && getTrackIdFromUrl(currentRelease.link)
                   ? currentRelease.albumId // <-- store album ID if track
                   : currentRelease.link,
            timestamp: Date.now(),
          });          
        }

        // Update the state to trigger re-render
        setCurrentReleaseIndex((prevIndex) => prevIndex + 1);
        setSwipeDirection(direction);

        if (currentReleaseIndex + 1 === allSongs.length) {
          setReachedEndOfList(true);
          setVotedOnAllSongs(true);
        }
      } catch (error) {
        console.error('Error updating Firestore:', error);
      }
    }
  };

  // Function to handle the end of transition animations
  const handleTransitionEnd = () => {
    setSwipeDirection(null);
  };

  // Function to toggle the visibility of the add song modal
  const handleAddSong = () => {
    if (!user) {
      openSignIn(); // Require authentication to submit songs
      return;
    }
    setAddSongModalOpen((prevOpen) => !prevOpen);
    setIsButtonActive((prevActive) => !prevActive);

    if (!isAddSongModalOpen) {
      setSpotifyUrl('');
    }
  };

  // Function to extract track ID from Spotify track URL
  const getTrackIdFromUrl = (url) => {
    const parts = url.split('/');
    const typeIndex = parts.indexOf('track');
    if (typeIndex !== -1 && typeIndex < parts.length - 1) {
      return {
        type: 'track',
        id: parts[typeIndex + 1],
      };
    }
    return undefined;
  };

  // Function to extract album ID from Spotify album URL
  const getAlbumIdFromUrl = (url) => {
    const parts = url.split('/');
    const typeIndex = parts.indexOf('album');
    if (typeIndex !== -1 && typeIndex < parts.length - 1) {
      return {
        type: 'album',
        id: parts[typeIndex + 1],
      };
    }
    return undefined;
  };

  // Function to handle song submission form
  const handleSongSubmission = async (event) => {
    event.preventDefault();
    const url = event.target.spotifyUrl.value;

    try {
      const { type, id } = getTrackIdFromUrl(url) || getAlbumIdFromUrl(url);

      if (!type || !id) {
        console.error('Invalid Spotify URL:', url);
        setSubmissionMessage('Invalid Spotify URL. Please provide a valid track or album URL.');
        setTimeout(() => { setSubmissionMessage(''); }, 3000);
        return;
      }

      const response = await axios.get(`/.netlify/functions/getSpotifyData?type=${type}&id=${id}`);
      const data = response.data;      

      let coverImage, releaseDate;
      if (type === 'track') {
        coverImage = data.album.images && data.album.images.length > 0 ? data.album.images[0].url : null;
        releaseDate = data.album.release_date;
      } else if (type === 'album') {
        coverImage = data.images && data.images.length > 0 ? data.images[0].url : null;
        releaseDate = data.release_date;
      }

      if (!coverImage || !releaseDate) {
        console.error(`Error fetching additional details: Missing coverImage or releaseDate for ${type}`);
        setSubmissionMessage(`Error fetching additional details: Missing coverImage or releaseDate for ${type}`);
        setTimeout(() => { setSubmissionMessage(''); }, 3000);
        return;
      }

      const isExists = userSubmittedSongs.some(
        (song) => song.title === data.name && song.artist === data.artists.map((artist) => artist.name).join(', ')
      );

      const isNewRelease = newReleases.some(
        (release) => release.title === data.name && release.artist === data.artists.map((artist) => artist.name).join(', ')
      );

      if (!isExists && !isNewRelease) {
        const userSubmittedSongsCollection = collection(firestore, 'userSubmittedSongs');
        await addDoc(userSubmittedSongsCollection, {
          id: data.id,
          title: data.name,
          artist: data.artists.map((artist) => artist.name).join(', '),
          coverImage: coverImage,
          link: type === 'track' ? data.album.id : data.id,
          releaseDate: releaseDate,
          timestamp: Date.now(),
        });

        setSpotifyUrl('');
        window.location.reload();
      } else {
        setSpotifyUrl('');
        setSubmissionMessage(`That ${type === 'track' ? 'Song' : 'Album'} Already Exists in the Poll.`);
        setTimeout(() => { setSubmissionMessage(''); }, 3000);
      }
    } catch (error) {
      console.error('Error fetching additional details:', error);
      setSubmissionMessage('Error fetching additional details. Please make sure the Spotify URL is correct.');
      setTimeout(() => { setSubmissionMessage(''); }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div id="trnt">
        <div className="trnt_turntable">
          <div className="trnt_floor"></div>
          <div className="trnt_arm"></div>
          <div className="trnt_vinyl">
            <div className="trnt_wheel trnt_wheel-1"></div>
            <div className="trnt_wheel trnt_wheel-2"></div>
            <div className="trnt_wheel trnt_wheel-3"></div>
            <div className="trnt_cover"></div>
            <div className="trnt_middle"></div>
            <div className="trnt_hole"></div>
          </div>
        </div>
        <span className='trnt_text'>Loading...</span>
      </div>
    );
  }
  
  return (
    <div>
      <title>Slaps N' Scraps | Polls</title>
  
      {/* Render Loading Animation if Data is Still Loading */}
      {isLoading && (
        <div id="trnt">
          {/* Turntable Loading Animation */}
          <div class="trnt_turntable">
            <div class="trnt_floor"></div>
            <div class="trnt_arm"></div>
            <div class="trnt_vinyl">
              <div class="trnt_wheel trnt_wheel-1"></div>
              <div class="trnt_wheel trnt_wheel-2"></div>
              <div class="trnt_wheel trnt_wheel-3"></div>
              <div class="trnt_cover"></div>
              <div class="trnt_middle"></div>
              <div class="trnt_hole"></div>
            </div>
          </div>
          {/* Loading Text */}
          <span className='trnt_text'>Loading</span>
        </div>
      )}

      {/* Render Polls Content if Data is Loaded */}
      {!votedOnAllSongs && (
        <>
          <div className="poll-container">
            <div className="poll-left">
              <h1>Scrap</h1>
              <div className="scrapsButton" onClick={() => handleSwipe('left')}>
                <svg className='scrapsLogo' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FE5F54"><path d="m368-592 89-147-59-98q-12-20-34.5-20T329-837l-98 163 137 82Zm387 272-89-148 139-80 64 107q11 17 12 38t-9 39q-10 20-29.5 32T800-320h-45ZM640-40 480-200l160-160v80h190l-58 116q-11 20-30 32t-42 12h-60v80Zm-387-80q-20 0-36.5-10.5T192-158q-8-16-7.5-33.5T194-224l34-56h172v160H253Zm-99-114L89-364q-9-18-8.5-38.5T92-441l16-27-68-41 219-55 55 220-69-42-91 152Zm540-342-219-55 69-41-125-208h141q21 0 39.5 10.5T629-841l52 87 68-42-55 220Z"/></svg>
              </div>
            </div>

            <div className="poll-middle">
              <h1 className='desktop-title'>or</h1>
              <h1 className='mobile-title'>Slap<span> or </span>Scrap</h1>
              {/* Song Information Display */}
              <div className={`songInfo ${swipeDirection}`} onTransitionEnd={handleTransitionEnd}>
                <div className="songInfoContainer">
                  {/* Album Cover */}
                  <div className="albumCover" {...handlers}>
                    <img
                      src={allSongs[currentReleaseIndex]?.coverImage || ''}
                      alt={allSongs[currentReleaseIndex]?.title + ' Cover'}
                    />
                  </div>

                  {/* Song Title */}
                  <div className="pollSongTitle">
                    <div className={`songName${allSongs[currentReleaseIndex]?.title && allSongs[currentReleaseIndex]?.title.length > 20 ? ' overflow' : ''}`}>
                      {allSongs[currentReleaseIndex]?.title || 'No songs available'}
                    </div>
                  </div>

                  {/* Artist Information */}
                  <div className="artist">
                    <div className={`artistTitle${allSongs[currentReleaseIndex]?.artist && allSongs[currentReleaseIndex]?.artist.length > 20 ? ' overflow' : ''}`}>
                      By: {allSongs[currentReleaseIndex]?.artist || 'Unknown Artist'}
                    </div>
                  </div>
                </div>
              </div>
                {/* Link to the Song on Spotify */}
                <div className="linkToSong">
                  <a
                    href={`https://open.spotify.com/album/${allSongs[currentReleaseIndex]?.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {'LINK TO ALBUM'}
                  </a>
              </div>
            </div>

            <div className="poll-right">
              <h1>Slap</h1>
              <div className="slapsButton" onClick={() => handleSwipe('right')}>
                <svg className='slapsLogo' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FE5F54"><path d="M880-759q0-51-35-86t-86-35v-60q75 0 128 53t53 128h-60ZM240-40q-83 0-141.5-58.5T40-240h60q0 58 41 99t99 41v60Zm162 0q-30 0-56-13.5T303-92L48-465l24-23q19-19 45-22t47 12l116 81v-383q0-17 11.5-28.5T320-840q17 0 28.5 11.5T360-800v537L212-367l157 229q5 8 14 13t19 5h278q33 0 56.5-23.5T760-200v-560q0-17 11.5-28.5T800-800q17 0 28.5 11.5T840-760v560q0 66-47 113T680-40H402Zm38-440v-400q0-17 11.5-28.5T480-920q17 0 28.5 11.5T520-880v400h-80Zm160 0v-360q0-17 11.5-28.5T640-880q17 0 28.5 11.5T680-840v360h-80ZM486-300Z"/></svg>
              </div>

              {/* Add Song Button */}
              <button
                className={`addSongButton ${isButtonActive ? 'active' : ''}`}
                onClick={handleAddSong}
              >
                +
              </button>
            </div>
          </div>

          {/* Add Song Modal */}
          {isAddSongModalOpen && (
            <div className="addSongModal visible">
              <form onSubmit={handleSongSubmission}>
                <legend className='formTitle'>Add A Song / Album To Polls</legend>

                {/* Input for Spotify Song URL */}
                <div className="inputs">
                  <input
                    className='pollInput'
                    type="url"
                    name="spotifyUrl"
                    required
                    placeholder='Spotify Song Link'
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                  />
                </div>

                {/* Submit Button */}
                <button className='pollSubmitButton' type="submit">Add Song</button>
              </form>
            </div>
          )}
        </>
      )}

      {/* Display Completion Message after Voting on All Songs */}
      {votedOnAllSongs && (
        <p className='pollCompleteText'>Thank you for completing our poll! Please feel free to add any songs we may have missed</p>
      )}

      {/* Display Submission Message */}
      {submissionMessage && <p className="submissionMessage">{submissionMessage}</p>}
    </div>
  );  
};

export default Polls;
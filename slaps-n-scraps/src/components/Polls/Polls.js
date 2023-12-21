import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { firestore } from '../backend/firebase';
import { collection, getDocs, addDoc, updateDoc, increment, query,where, writeBatch} from 'firebase/firestore';
import axios from 'axios';
import './Polls.css';
import Slaps from '../../images/slap.png';
import Scraps from '../../images/scraps.png';

// The main Polls component responsible for managing and displaying song polls.
const Polls = () => {
  // State variables to manage component state
  const [newReleases, setNewReleases] = useState([]);
  const [currentReleaseIndex, setCurrentReleaseIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [reachedEndOfList, setReachedEndOfList] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddSongModalOpen, setAddSongModalOpen] = useState(false);
  const [userSubmittedSongs, setUserSubmittedSongs] = useState([]);
  const [votedOnAllSongs, setVotedOnAllSongs] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState('');

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

  // Function to fetch new releases from the Spotify API
  const fetchNewReleases = async () => {
    try {
      // Authentication credentials for the Spotify API
      const clientId = process.env.REACT_APP_CLIENT_ID;
      const clientSecret = process.env.REACT_APP_CLIENT_SECRET;
      const base64Credentials = btoa(`${clientId}:${clientSecret}`);

      // Request an access token from the Spotify API
      const response = await axios('https://accounts.spotify.com/api/token', {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Credentials}`,
        },
        data: 'grant_type=client_credentials',
      });

      const accessToken = response.data.access_token;

      // Fetch new releases using the obtained access token
      const newReleasesResponse = await axios.get('https://api.spotify.com/v1/browse/new-releases?limit=25', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = newReleasesResponse.data;

      // Transform Spotify API response into a simplified releases array
      const releases = data.albums.items.map((album) => ({
        id: album.id,
        title: album.name,
        artist: album.artists.map((artist) => artist.name).join(', '),
        coverImage: album.images[0].url,
        releaseDate: album.release_date,
        link: album.id,
        isUserSubmitted: false,
      }));

      setAccessToken(accessToken);
      setIsLoading(false);

      return releases; // Return the releases array
    } catch (error) {
      console.error('Error fetching new releases:', error);
      setIsLoading(false);
      return []; // Return an empty array in case of an error
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
            link: "https://open.spotify.com/album/"+currentRelease.link,
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
      // Extract the type and ID from the URL
      const { type, id } = getTrackIdFromUrl(url) || getAlbumIdFromUrl(url);

      if (!type || !id) {
        // Handle invalid URL
        console.error('Invalid Spotify URL:', url);
        setSubmissionMessage('Invalid Spotify URL. Please provide a valid track or album URL.');
        setTimeout(() => {
          setSubmissionMessage('');
        }, 3000);
        return;
      }

      // Fetch additional details from Spotify using the provided URL
      const response = await axios.get(`https://api.spotify.com/v1/${type}s/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = response.data;

      // Extract coverImage and releaseDate based on the type
      let coverImage, releaseDate;

      if (type === 'track') {
        // For tracks, use the track-specific properties
        coverImage = data.album.images && data.album.images.length > 0 ? data.album.images[0].url : null;
        releaseDate = data.album.release_date;
      } else if (type === 'album') {
        // For albums, use the album-specific properties
        coverImage = data.images && data.images.length > 0 ? data.images[0].url : null;
        releaseDate = data.release_date;
      }

      // Check if coverImage and releaseDate are available
      if (!coverImage || !releaseDate) {
        console.error(`Error fetching additional details: Missing coverImage or releaseDate for ${type}`);
        setSubmissionMessage(`Error fetching additional details: Missing coverImage or releaseDate for ${type}`);
        setTimeout(() => {
          setSubmissionMessage('');
        }, 3000);
        return;
      }

      // Check if the song/album is not already in the userSubmittedSongs array
      const isExists = userSubmittedSongs.some(
        (song) => song.title === data.name && song.artist === data.artists.map((artist) => artist.name).join(', ')
      );

      const isNewRelease = newReleases.some(
        (release) => release.title === data.name && release.artist === data.artists.map((artist) => artist.name).join(', ')
      );

      if (!isExists && !isNewRelease) {
        // Add the new song/album to the 'userSubmittedSongs' collection in Firestore
        const userSubmittedSongsCollection = collection(firestore, 'userSubmittedSongs');
        await addDoc(userSubmittedSongsCollection, {
          id: data.id,
          title: data.name,
          artist: data.artists.map((artist) => artist.name).join(', '),
          coverImage: coverImage,
          link: data.id, // Use ID as the link
          releaseDate: releaseDate,
          timestamp: Date.now(),
        });

        // Clear the input field using the state setter after successful submission
        setSpotifyUrl('');

        // Reload the page to reflect the newly added song
        window.location.reload();
      } else {
        // Clear the input field
        setSpotifyUrl('');

        // Set an error message if the song/album already exists
        setSubmissionMessage(`That ${type === 'track' ? 'Song' : 'Album'} Already Exists in the Poll.`);

        // Automatically clear the error message after 3 seconds
        setTimeout(() => {
          setSubmissionMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error fetching additional details:', error);

      // Set a clear error message for the user
      setSubmissionMessage('Error fetching additional details. Please make sure the Spotify URL is correct.');

      // Automatically clear the error message after 3 seconds
      setTimeout(() => {
        setSubmissionMessage('');
      }, 3000);
    }
  };

  // Display loading animation while data is being fetched
  if (isLoading) {
    return (
      <div id="trnt">
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
        <span className='trnt_text'>Loading...</span>
      </div>
    );
  }

  return (
    <div>
      {/* SLAPS N' SCRAPS Header */}
      <h1 className='snsLogo'>SLAPS <span>N'</span> SCRAPS</h1>
  
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
          {/* Polls Information Display */}
          <div className={`pollsInfo ${swipeDirection}`} onTransitionEnd={handleTransitionEnd}>
            <h2 className='pollsTitle_Scrap'>Scrap</h2>
            <h2 className='pollsTitle_Or'>OR</h2>
            <h2 className='pollsTitle_Slap'>Slap</h2>
          </div>

          {/* Song Information Display */}
          <div className={`songInfo ${swipeDirection}`} onTransitionEnd={handleTransitionEnd}>
            <div className="songInfoContainer">
              {/* Song Title */}
              <div className="title">
                <div className={`songName${allSongs[currentReleaseIndex]?.title && allSongs[currentReleaseIndex]?.title.length > 20 ? ' overflow' : ''}`}>
                  {allSongs[currentReleaseIndex]?.title || 'No songs available'}
                </div>
              </div>

              {/* Album Cover */}
              <div className="albumCover">
                <img
                  src={allSongs[currentReleaseIndex]?.coverImage || ''}
                  alt={allSongs[currentReleaseIndex]?.title + ' Cover'}
                />
              </div>

              {/* Artist Information */}
              <div className="artist">
                <div className={`artistTitle${allSongs[currentReleaseIndex]?.artist && allSongs[currentReleaseIndex]?.artist.length > 20 ? ' overflow' : ''}`}>
                  By: {allSongs[currentReleaseIndex]?.artist || 'Unknown Artist'}
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
          </div>

          {/* Scrap and Slap Buttons */}
          <div className="scrapsButton" onClick={() => handleSwipe('left')}>
            <img src={Scraps} alt="" className="scrapsLogo" />
          </div>
          <div className="slapsButton" onClick={() => handleSwipe('right')}>
            <img src={Slaps} alt="" className="slapsLogo" />
          </div>

          {/* Add Song Button */}
          <button
            className={`addSongButton ${isButtonActive ? 'active' : ''}`}
            onClick={handleAddSong}
          >
            +
          </button>

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
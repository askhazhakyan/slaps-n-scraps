import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Home.css';
import Knob from '../../images/knob.png';
import Needle from '../../images/needle.png';
import Arrow from '../../images/arrow.png';

const Home = () => {
  // State variables
  const [newReleases, setNewReleases] = useState([]);
  const [currentReleaseIndex, setCurrentReleaseIndex] = useState(0);

  // Refs for dynamically measuring text width
  const songTitleRef = useRef(null);
  const artistNameRef = useRef(null);
  const [showMessage, setShowMessage] = useState(true);

  // Function to handle clicking on the next arrow
  const handleNextClick = () => {
    if (currentReleaseIndex < newReleases.length - 1) {
      setCurrentReleaseIndex(currentReleaseIndex + 1);
      setShowMessage(false); // Hide the message when an arrow is clicked
    } else {
      // If on the last song, go to the first song
      setCurrentReleaseIndex(0);
      setShowMessage(false); // Hide the message when an arrow is clicked
    }
  };

  // Function to handle clicking on the previous arrow
  const handlePrevClick = () => {
    if (currentReleaseIndex > 0) {
      setCurrentReleaseIndex(currentReleaseIndex - 1);
      setShowMessage(false); // Hide the message when an arrow is clicked
    } else {
      // If on the first song, go to the last song
      setCurrentReleaseIndex(newReleases.length - 1);
      setShowMessage(false); // Hide the message when an arrow is clicked
    }
  };


  // Effect to fetch new releases from Spotify API on component mount
  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        // Spotify API credentials
        const clientId = process.env.REACT_APP_CLIENT_ID;
        const clientSecret = process.env.REACT_APP_CLIENT_SECRET;
        const base64Credentials = btoa(`${clientId}:${clientSecret}`);

        // Get access token
        const response = await axios('https://accounts.spotify.com/api/token', {
          method: 'post',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Credentials}`,
          },
          data: 'grant_type=client_credentials',
        });

        const accessToken = response.data.access_token;

        // Fetch new releases using the access token
        const newReleasesResponse = await axios.get('https://api.spotify.com/v1/browse/new-releases?limit=25', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const data = newReleasesResponse.data;

        // Extract relevant data from the response
        const releases = data.albums.items.map((album) => ({
          title: album.name,
          artist: album.artists.map((artist) => artist.name).join(', '),
          coverImage: album.images[0].url,
          releaseDate: album.release_date,
          link: album.id,
        }));

        setNewReleases(releases);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    // Fetch new releases
    fetchNewReleases();
  }, []);

  // Function to handle left and right arrow key events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        // If on the first song, go to the last song
        setCurrentReleaseIndex((prevIndex) => (prevIndex === 0 ? newReleases.length - 1 : prevIndex - 1));
        setShowMessage(false); // Hide the message when an arrow key is pressed
      } else if (event.key === 'ArrowRight') {
        // If on the last song, go to the first song
        setCurrentReleaseIndex((prevIndex) => (prevIndex === newReleases.length - 1 ? 0 : prevIndex + 1));
        setShowMessage(false); // Hide the message when an arrow key is pressed
      }
    };

    // Add event listener when the component mounts
    document.addEventListener('keydown', handleKeyDown);

    // Remove event listener when the component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentReleaseIndex, newReleases]);

  // Effect to update custom properties for marquee animation
  useEffect(() => {
    const songTitleWidth = songTitleRef.current?.clientWidth || 0;
    const artistNameWidth = artistNameRef.current?.clientWidth || 0;

    document.documentElement.style.setProperty('--width', `-${songTitleWidth}px`);
    document.documentElement.style.setProperty('--artistNameWidth', `-${artistNameWidth}px`);
  }, [newReleases, currentReleaseIndex]);

  // JSX structure
  return (
    <div>
      {showMessage && (
        <div className="pulsing-text">
          Use Arrows To See All Songs
        </div>
      )}

      {/* SLAPS N' SCRAPS title */}
      <h1 className='title'>SLAPS <span>N'</span> SCRAPS</h1>
      {/* Circular background */}
      <div className="semicircle">
        <div className="cover">
          {/* Display album cover image */}
          <img src={newReleases[currentReleaseIndex]?.coverImage || ''} alt={newReleases[currentReleaseIndex]?.title + ' Cover'} />
        </div>
      </div>
      {/* Pin element */}
      <div className="pin" />
      {/* Information section */}
      <div className="info">
        {/* Page title */}
        <h2 className='pageTitle'>This Week's <span>New</span> Releases</h2>
        {/* Screen container */}
        <div className="screen">
          {/* Screen content */}
          <div className="screenInfo">
            {/* Header container */}
            <div className="headerContainer">
              {/* Header text */}
              <h1 className='header'>Now Playing: </h1>
            </div>
            {/* Song title container */}
            <div className="songTitleContainer" ref={songTitleRef}>
              {/* Song title with marquee animation */}
              <div className={`songTitle${newReleases[currentReleaseIndex]?.title && newReleases[currentReleaseIndex]?.title.length > 20 ? ' overflow' : ''}`}>
                {newReleases[currentReleaseIndex]?.title || 'No songs available'}
              </div>
            </div>
            {/* Footer container */}
            <div className="footerContainer">
              {/* Footer text */}
              <h1 className="footer">By:</h1>
            </div>
            {/* Artist name container */}
            <div className="artistNameContainer" ref={artistNameRef}>
              {/* Artist name with marquee animation */}
              <div className={`artistName${newReleases[currentReleaseIndex]?.artist && newReleases[currentReleaseIndex]?.artist.length > 20 ? ' overflow' : ''}`}>
                {newReleases[currentReleaseIndex]?.artist || 'Unknown Artist'}
              </div>
            </div>
          </div>
        </div>
        <div className="volumeKnobContainer">
          <img className='volume' src={Knob} alt="Volume Knob" />
        </div>
        <div className="needleContainer">
          <img className='needle' src={Needle} alt="Record Player Needle" />
        </div>
        <div className="arrowContainer">
          <img className='prev' src={Arrow} alt="Previous Song" onClick={handlePrevClick} />
          <img className='next' src={Arrow} alt="Next Song" onClick={handleNextClick} />
        </div>
          {/* Link to song */}
          <div className="link">
            <a
              href={`https://open.spotify.com/album/${newReleases[currentReleaseIndex]?.link}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {'LINK TO ALBUM'}
            </a>
          </div>  
      </div>
    </div>
  );
};

export default Home;
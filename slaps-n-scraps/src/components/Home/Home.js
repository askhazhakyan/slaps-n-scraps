import React, { useState, useEffect, useRef } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import axios from 'axios';
import './Home.css';
import Needle from '../../images/needle.png';
import Arrow from '../../images/arrow.png';

const Home = () => {
  const { user } = useUser();
  const { openSignIn, openProfile } = useClerk();
  const [newReleases, setNewReleases] = useState([]);
  const [currentReleaseIndex, setCurrentReleaseIndex] = useState(0);
  const songTitleRef = useRef(null);
  const artistNameRef = useRef(null);
  const [showMessage, setShowMessage] = useState(true);
  const [isSongTitleOverflow, setIsSongTitleOverflow] = useState(false);
  const [isArtistNameOverflow, setIsArtistNameOverflow] = useState(false);

  const handleNextClick = () => {
    setCurrentReleaseIndex((prevIndex) =>
      prevIndex < newReleases.length - 1 ? prevIndex + 1 : 0
    );
    setShowMessage(false);
  };

  const handlePrevClick = () => {
    setCurrentReleaseIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : newReleases.length - 1
    );
    setShowMessage(false);
  };

  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        const clientId = process.env.REACT_APP_CLIENT_ID;
        const clientSecret = process.env.REACT_APP_CLIENT_SECRET;
        const base64Credentials = btoa(`${clientId}:${clientSecret}`);

        const response = await axios('https://accounts.spotify.com/api/token', {
          method: 'post',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Credentials}`,
          },
          data: 'grant_type=client_credentials',
        });

        const accessToken = response.data.access_token;

        const newReleasesResponse = await axios.get(
          'https://api.spotify.com/v1/browse/new-releases?limit=25',
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const data = newReleasesResponse.data;

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

    fetchNewReleases();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') handlePrevClick();
      else if (event.key === 'ArrowRight') handleNextClick();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentReleaseIndex]);

  useEffect(() => {
    const songTitleWidth = songTitleRef.current?.clientWidth || 0;
    const artistNameWidth = artistNameRef.current?.clientWidth || 0;

    document.documentElement.style.setProperty('--width', `-${songTitleWidth}px`);
    document.documentElement.style.setProperty('--artistNameWidth', `-${artistNameWidth}px`);

    const containerWidth = songTitleRef.current?.parentElement.clientWidth || 0;
    setIsSongTitleOverflow(songTitleWidth > containerWidth);
    setIsArtistNameOverflow(artistNameWidth > containerWidth);
  }, [newReleases, currentReleaseIndex]);

  return (
    <div className="home-body">
      <title>Slaps N' Scraps | Home</title>

      <div className="left-container">
        <div className="semicircle">
          <div className="needleContainer">
            <img className="needle" src={Needle} alt="Record Player Needle" />
          </div>
          <div className="cover">
            <img
              src={newReleases[currentReleaseIndex]?.coverImage || ''}
              alt={newReleases[currentReleaseIndex]?.title + ' Cover'}
            />
          </div>
        </div>
        <div className="pin" />
      </div>

      <div className="right-container">
        {showMessage && <div className="pulsing-text">Use Arrows To See All Songs</div>}
        <div className="info">
          <h2 className="pageTitle">
            This Week's <span>New</span> Releases
          </h2>
          <div className="screen-box">
            <div className="screen">
              <div className="headerContainer">
                <h1 className="header">Now Playing: </h1>
                <div className="songContainer">
                  <div
                    ref={songTitleRef}
                    className={`songTitle ${isSongTitleOverflow ? 'marquee' : ''}`}
                  >
                    {newReleases[currentReleaseIndex]?.title || 'No songs available'}
                  </div>
                </div>
              </div>

              <div className="footerContainer">
                <h1 className="footer">By:</h1>
                <div className="artistContainer">
                  <div
                    ref={artistNameRef}
                    className={`artistName ${isArtistNameOverflow ? 'marquee' : ''}`}
                  >
                    {newReleases[currentReleaseIndex]?.artist || 'Unknown Artist'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="options">
            <img className="prev" src={Arrow} alt="Previous Song" onClick={handlePrevClick} />
            <a
              className="link"
              href={`https://open.spotify.com/album/${newReleases[currentReleaseIndex]?.link}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              LINK TO ALBUM
            </a>
            <img className="next" src={Arrow} alt="Next Song" onClick={handleNextClick} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
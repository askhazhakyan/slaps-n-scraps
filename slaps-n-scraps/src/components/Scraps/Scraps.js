import React, { useState, useEffect, useRef } from 'react';
import { firestore } from '../backend/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import './Scraps.css';
import Scrap from '../../images/scraps.png';

// Scraps component to display certified scraps
const Scraps = () => {
  // State to hold certified scraps data
  const [certifiedScraps, setCertifiedScraps] = useState([]);
  // Reference to the container for horizontal scroll
  const scrapsContainerRef = useRef(null);
  // State to manage the visibility of the scroll message
  const [showMessage, setShowMessage] = useState(true);
  // State to manage the search query
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch certified scraps data on mount
  useEffect(() => {
    const fetchCertifiedScraps = async () => {
      try {
        // Query Firestore for songs collection, ordered by timestamp
        const songsCollection = collection(firestore, 'songs');
        const q = query(songsCollection, orderBy('timestamp', 'desc'));

        // Subscribe to changes in the query and update state accordingly
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const scraps = [];

          for (const doc of querySnapshot.docs) {
            const { title, artist, likes, totalVotes, timestamp, coverImage, link } = doc.data();

            if (likes !== undefined && (totalVotes === undefined || typeof totalVotes === 'number')) {
              const validTotalVotes = typeof totalVotes === 'number' ? totalVotes : 0;
              const percentage = validTotalVotes !== 0 ? (likes / validTotalVotes) * 100 : 0;

              // Check if the song is a certified scrap
              if (percentage <= 50 && validTotalVotes >= 100) {
                scraps.push({
                  title,
                  artist,
                  likes,
                  totalVotes: validTotalVotes,
                  percentage,
                  coverImage,
                  timestamp,
                  link,
                });
              }
            } else {
              console.error('Invalid data for document:', doc.id);
            }
          }

          // Sort scraps by timestamp and update state
          scraps.sort((a, b) => b.timestamp - a.timestamp);
          setCertifiedScraps(scraps);

          // Update showMessage based on the number of scraps
          setShowMessage(scraps.length > 4);
        });

        // Unsubscribe from Firestore when component unmounts
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error fetching certified scraps:', error);
      }
    };

    // Call the fetch function
    fetchCertifiedScraps();
  }, []); 

  // Effect to handle horizontal scroll and hide the message
  useEffect(() => {
    const handleScroll = () => {
      const scrapsContainer = scrapsContainerRef.current;
      const isScrolledHorizontally = scrapsContainer.scrollLeft > 0;

      // Hide the message if horizontal scroll is detected
      if (isScrolledHorizontally) {
        setShowMessage(false);
      }
    };

    // Get the scraps container reference
    const scrapsContainer = scrapsContainerRef.current;

    // Attach scroll event listener and clean up on unmount
    if (scrapsContainer) {
      scrapsContainer.addEventListener('scroll', handleScroll);

      return () => {
        scrapsContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [scrapsContainerRef]);

  // Filter certified scraps based on search query
  const filteredCertifiedScraps = certifiedScraps.filter((scrap) => {
    const searchRegex = new RegExp(searchQuery, 'i');
    return searchRegex.test(scrap.title) || searchRegex.test(scrap.artist);
  });

  // Render the Scraps component
  return (
    <div>
      {/* SCRAPS PILE title */}
      <h1 className='siteLogo'>SLAPS <span>N' </span>SCRAPS</h1>

      {/* Show scroll message if showMessage is true */}
      {showMessage && (
        <div className="scraps-pulsing-text">
          Scroll To See All Songs
        </div>
      )}

      {/* Certified Scraps section */}
      <div className="scrapsInfo">
        <h2 className='scrapsPageTitle'>Scraps <span>Pile</span></h2>

        {/* Search bar */}
        <div className="search">
          <input
            type="text"
            placeholder=" "
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div>
            <svg>
              <use xlinkHref="#path"></use>
            </svg>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
            <symbol xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 28" id="path">
              <path d="M32.9418651,-20.6880772 C37.9418651,-20.6880772 40.9418651,-16.6880772 40.9418651,-12.6880772 C40.9418651,-8.68807717 37.9418651,-4.68807717 32.9418651,-4.68807717 C27.9418651,-4.68807717 24.9418651,-8.68807717 24.9418651,-12.6880772 C24.9418651,-16.6880772 27.9418651,-20.6880772 32.9418651,-20.6880772 L32.9418651,-29.870624 C32.9418651,-30.3676803 33.3448089,-30.770624 33.8418651,-30.770624 C34.08056,-30.770624 34.3094785,-30.6758029 34.4782612,-30.5070201 L141.371843,76.386562" transform="translate(83.156854, 22.171573) rotate(-225.000000) translate(-83.156854, -22.171573)"></path>
            </symbol>
          </svg>
        </div>

        {/* Container for certified scraps with horizontal scroll */}
        <div className="scrapsContainer" ref={scrapsContainerRef}>
          {filteredCertifiedScraps.map((scrap, index) => (
            // Individual scrap card
            <div key={index} className="scrapCard">
              <div className="scrapContainerHeader">
                <img src={Scrap} alt="Scrap Logo" className="scrapImage" />
              </div>
              <img className='songImage' src={scrap.coverImage} alt={`${scrap.title} Cover`} />
              <h3 className='scrapSongTitle'>{scrap.title}</h3>
              <p className='scrapArtistTitle'>{scrap.artist}</p>

              {/* Ratings bar for Scraps component */}
              <div className="scrapsRatingsBar">
                <div className="scrapsBar"></div>
                <div className="scrapsFilled" style={{ width: `${scrap.percentage}%` }}></div>
              </div>

              <p className='percentage'>{`${Math.round(scrap.percentage)}%`}</p>

              {/* Link to song */}
              <div className="scrapSongLink">
                <a
                  href={scrap.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {'LINK TO ALBUM'}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Scraps;
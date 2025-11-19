import React, { useState, useEffect, useRef } from 'react';
import { firestore } from '../backend/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useUser } from '@clerk/clerk-react';
import './Scraps.css';
import Scrap from '../../images/scraps.png';

// Scraps component to display certified scraps
const Scraps = () => {
  // State to hold certified scraps data
  const [certifiedScraps, setCertifiedScraps] = useState([]);
  // Reference to the container for horizontal scroll
  const scrapsContainerRef = useRef(null);
  // State to manage the search query
  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line
  const { user } = useUser();

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
      // eslint-disable-next-line
      const isScrolledHorizontally = scrapsContainer.scrollLeft > 0;
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
      <title>Slaps N' Scraps | Scraps</title>
      {/* Show scroll message if showMessage is true
      {showMessage && (
        <div className="scraps-pulsing-text">
          Scroll To See All Songs
        </div>
      )} */}

      {/* Certified Scraps section */}
      <div className="scrapsInfo">
        <h2 className='scrapsPageTitle'>Scraps <span>Pile</span></h2>

        {/* Search bar */}
        <div className="scrapsSearch">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => document.querySelector(".scrapsSearch input").style.width = "150px"} // Expands input on focus
            onBlur={() => !searchQuery && (document.querySelector(".scrapsSearch input").style.width = "0")} // Collapses input if empty
          />
          <button className="btn-search" onClick={() => document.querySelector(".scrapsSearch input").focus()}>
            <i className="fas fa-search"></i>
          </button>
        </div>

        {/* Container for certified scraps with horizontal scroll */}
        <div className="scrapsContainer" ref={scrapsContainerRef}>
          {filteredCertifiedScraps.map((scrap, index) => (
            // Individual scrap card
            <div key={index} className="scrapCard">
              <div className="scrapContainerHeader">
                <img src={Scrap} alt="Scrap Logo" className="scrapImage" />
              </div>
              <img className='scrapSongImage' src={scrap.coverImage} alt={`${scrap.title} Cover`} />
              <h3 className='scrapSongTitle'>{scrap.title}</h3>
              <p className='scrapArtistTitle'>{scrap.artist}</p>

              {/* Ratings bar for Scraps component */}
              <div className="scrapsRatingsBar">
                <div className="scrapsBar"></div>
                <div className="scrapsFilled" style={{ width: `${scrap.percentage}%` }}></div>
                <p className='scrapsPercentage'>{`${Math.round(scrap.percentage)}%`}</p> 
              </div>

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
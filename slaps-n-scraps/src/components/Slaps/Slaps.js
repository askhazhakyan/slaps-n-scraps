import React, { useState, useEffect, useRef } from 'react';
import { firestore } from '../backend/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import './Slaps.css';
import Slap from '../../images/slap.png';

// Slaps component to display certified slappers
const Slaps = () => {
  // State to hold certified slappers data
  const [certifiedSlappers, setCertifiedSlappers] = useState([]);
  // Reference to the container for horizontal scroll
  const slappersContainerRef = useRef(null);
  // State to manage the visibility of the scroll message
  const [showMessage, setShowMessage] = useState(true);
  // State to manage the search query
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch certified slappers data on mount
  useEffect(() => {
    const fetchCertifiedSlappers = async () => {
      try {
        // Query Firestore for songs collection, ordered by timestamp
        const songsCollection = collection(firestore, 'songs');
        const q = query(songsCollection, orderBy('timestamp', 'desc'));

        // Subscribe to changes in the query and update state accordingly
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const slappers = [];

          for (const doc of querySnapshot.docs) {
            const { title, artist, likes, totalVotes, timestamp, coverImage, link } = doc.data();

            // Check if likes is defined and totalVotes is a valid number
            if (likes !== undefined && (totalVotes === undefined || typeof totalVotes === 'number')) {
              // Handle the case where totalVotes is undefined (set it to 0)
              const validTotalVotes = typeof totalVotes === 'number' ? totalVotes : 0;

              // Calculate the percentage of likes
              const percentage = validTotalVotes !== 0 ? (likes / validTotalVotes) * 100 : 0;

              // Check if the song is a certified slapper
              if (percentage >= 75 && totalVotes >= 100) {
                slappers.push({
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

          // Sort slappers by timestamp and update state
          slappers.sort((a, b) => b.timestamp - a.timestamp);
          setCertifiedSlappers(slappers);

          // Update showMessage based on the number of slappers
          setShowMessage(slappers.length > 4);
        });

        // Unsubscribe from Firestore when component unmounts
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error fetching certified slappers:', error);
      }
    };

    // Call the fetch function
    fetchCertifiedSlappers();
  }, []); // Empty dependency array to run the effect only once on mount

  // Effect to handle horizontal scroll and hide the message
  useEffect(() => {
    const handleScroll = () => {
      const slappersContainer = slappersContainerRef.current;
      const isScrolledHorizontally = slappersContainer.scrollLeft > 0;

      // Hide the message if horizontal scroll is detected
      if (isScrolledHorizontally) {
        setShowMessage(false);
      }
    };

    // Get the slappers container reference
    const slappersContainer = slappersContainerRef.current;

    // Attach scroll event listener and clean up on unmount
    if (slappersContainer) {
      slappersContainer.addEventListener('scroll', handleScroll);

      return () => {
        slappersContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [slappersContainerRef]);

  // Filter certified slappers based on search query
  const filteredCertifiedSlappers = certifiedSlappers.filter((slapper) => {
    const searchRegex = new RegExp(searchQuery, 'i');
    return searchRegex.test(slapper.title) || searchRegex.test(slapper.artist);
  });

  // Render the Slaps component
  return (
    <div className=''>
      {/* SLAPS N' SCRAPS title */}
      <h1 className='siteLogo'>SLAPS <span>N'</span> SCRAPS</h1>

      {/* Show scroll message if showMessage is true */}
      {showMessage && (
        <div className="slaps-pulsing-text">
          Scroll To See All Songs
        </div>
      )}

      {/* Certified Slappers section */}
      <div className="slapsInfo">
        <h2 className='slapsPageTitle'>Certified <span>Slappers</span></h2>

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

        <div className="slappersContainer" ref={slappersContainerRef}>
          {filteredCertifiedSlappers.map((slapper, index) => (
            // Individual slapper card
            <div key={index} className="slapperCard">
              <div className="slapContainerHeader">
                <img src={Slap} alt="Slap Logo" className="slapImage" />
              </div>
              <img className='songImage' src={slapper.coverImage} alt={`${slapper.title} Cover`} />
              <h3 className='slapSongTitle'>{slapper.title}</h3>
              <p className='slapArtistTitle'>{slapper.artist}</p>

              {/* Ratings bar for Slaps component */}
              <div className="slapsRatingsBar">
                <div className="slapsBar"></div>
                <div className="slapsFilled" style={{ width: `${slapper.percentage}%` }}></div>
              </div>

              <p className='percentage'>{`${Math.round(slapper.percentage)}%`}</p>

              {/* Link to song */}
              <div className="slapperSongLink">
                <a
                  href={slapper.link}
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

export default Slaps;
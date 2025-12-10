import React, { useState, useEffect, useRef } from 'react';
import { firestore } from '../backend/firebase';
import { collection, onSnapshot, query, orderBy} from 'firebase/firestore';
import { useUser, useAuth } from '@clerk/clerk-react';
import './Slaps.css';
import Slap from '../../images/slap.png';

// Slaps component to display certified slappers
const Slaps = () => {
  // State to hold certified slappers data
  const [certifiedSlappers, setCertifiedSlappers] = useState([]);
  // Reference to the container for horizontal scroll
  const slappersContainerRef = useRef(null);
  // State to manage the search query
  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line
  const { user } = useUser();
  // eslint-disable-next-line
  const { signOut } = useAuth();  

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
      // eslint-disable-next-line
      const isScrolledHorizontally = slappersContainer.scrollLeft > 0;
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
      <title>Slaps N' Scraps | Slaps</title>

      {/* Certified Slappers section */}
      <div className="slapsInfo">
        <h2 className='slapsPageTitle'>Certified <span>Slappers</span></h2>

        <div className="slapsSearch">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => document.querySelector(".slapsSearch input").style.width = "150px"} // Expands input on focus
            onBlur={() => !searchQuery && (document.querySelector(".slapsSearch input").style.width = "0")} // Collapses input if empty
          />
          <button className="btn-search" onClick={() => document.querySelector(".slapsSearch input").focus()}>
            <i className="fas fa-search"></i>
          </button>
        </div>

        <div className="slappersContainer" ref={slappersContainerRef}>
          {filteredCertifiedSlappers.length > 0 ? (
            filteredCertifiedSlappers.map((slapper, index) => (
              <div key={index} className="slapperCard">
                <div className="slapContainerHeader">
                  <img src={Slap} alt="Slap Logo" className="slapImage" />
                </div>
                <img className='slapSongImage' src={slapper.coverImage} alt={`${slapper.title} Cover`} />
                <h3 className='slapSongTitle'>{slapper.title}</h3>
                <p className='slapArtistTitle'>{slapper.artist}</p>

                <div className="slapsRatingsBar">
                  <div className="slapsBar"></div>
                  <div className="slapsFilled" style={{ width: `${slapper.percentage}%` }}></div>
                  <p className='slapsPercentage'>{`${Math.round(slapper.percentage)}%`}</p>
                </div>

                <div className="slapperSongLink">
                  <a href={slapper.link} target="_blank" rel="noopener noreferrer">
                    {'LINK TO ALBUM'}
                  </a>
                </div>
              </div>
            ))
          ) : searchQuery ? (
            <div className="noResultsMessage">
              <p>No results found for "{searchQuery}".</p>
            </div>
          ) : (
            <div className="noSlapsMessage">
              <p>There aren't enough votes to show certified slappers yet. <br /> Head over to the <a href="/polls">Polls page</a> and cast your vote!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Slaps;
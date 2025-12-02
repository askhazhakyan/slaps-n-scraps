import React, { useState, useEffect, useRef } from 'react';
import { firestore } from '../backend/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import axios from 'axios';
import './Blog.css';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';

const Blog = () => {
  const { user } = useUser();
  const inputRef = useRef(null);
  // eslint-disable-next-line
  const { openSignIn, signOut } = useClerk();

  const [blogPosts, setBlogPosts] = useState([]);
  const [isAddPostModalOpen, setAddPostModalOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [score, setScore] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [writerName, setWriterName] = useState(user ? user.fullName || user.username : '');
  const [scoreError, setScoreError] = useState('');
  // eslint-disable-next-line
  const [spotifyInfo, setSpotifyInfo] = useState({
    title: '',
    artist: '',
    coverImage: '',
  });
  const [isSearchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const blogPostsCollection = collection(firestore, 'blogs');
        const blogPostsSnapshot = await getDocs(blogPostsCollection);
        const posts = blogPostsSnapshot.docs.map((doc) => doc.data());

        const filteredPosts = posts.filter((post) => {
          const normalize = (str) =>
            str
              .toLowerCase()
              .replace(/[\s’'“”"`~!@#$%^&*()_+=\-[\]\\{}|;:,.<>/?]/g, '');
        
          const query = normalize(searchQuery);
          if (!query) return true;
        
          const author = normalize(post.author || '');
          const reviewTitle = normalize(post.title || '');
          const spotifyTitle = normalize(post.spotifyInfo?.trackTitle || post.spotifyInfo?.albumTitle || '');
          const artist = normalize(post.spotifyInfo?.trackArtists || post.spotifyInfo?.albumArtists || '');
          
        
          return author.includes(query) || reviewTitle.includes(query) || spotifyTitle.includes(query) || artist.includes(query);
        });
                      

        filteredPosts.sort((a, b) => b.postTime - a.postTime);

        setBlogPosts(filteredPosts);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      }
    };

    fetchBlogPosts();
  }, [searchQuery]);

  const handleAddPost = async () => {
    if (!user) {
      openSignIn();
      return;
    }
  
    try {
      // Validate score
      const scoreRegex = /^(10(\.0)?|[0-9](\.[0-9])?)$/;
      if (!scoreRegex.test(score)) {
        console.error('Invalid score format. Please enter a valid score.');
        return;
      }
  
      // Parse Spotify link
      let type, id;
      try {
        const url = new URL(spotifyLink);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        type = pathSegments[0];
        id = pathSegments[1];
  
        if (type !== 'track' && type !== 'album') {
          throw new Error('Not a track or album URL');
        }
      } catch (err) {
        console.error('Invalid Spotify link format. Please provide a valid track or album URL.');
        return;
      }
  
      // Check for existing review
      const existingReviews = blogPosts.filter(
        (post) => post.author === writerName && post.link === spotifyLink
      );
      if (existingReviews.length > 0) {
        console.error('You have already submitted a review for this song/album.');
        return;
      }
  
      // Call serverless function to fetch Spotify data
      const spotifyResponse = await axios.post('/.netlify/functions/getSpotifyData', {
        type,
        id,
      });
  
      const data = spotifyResponse.data;
  
      let spotifyInfo = {};
      if (type === 'track') {
        spotifyInfo = {
          trackTitle: data.name,
          trackArtists: data.artists.map(a => a.name).join(', '),
          trackCover: data.album.images[0]?.url || '',
          albumTitle: '',
          albumArtists: '',
          albumCover: '',
        };
      } else {
        spotifyInfo = {
          albumTitle: data.name,
          albumArtists: data.artists.map(a => a.name).join(', '),
          albumCover: data.images[0]?.url || '',
          trackTitle: '',
          trackArtists: '',
          trackCover: '',
        };
      }
  
      // Add to Firestore
      await addDoc(collection(firestore, 'blogs'), {
        author: writerName,
        link: spotifyLink,
        postTime: Date.now(),
        review: postContent,
        score: parseFloat(score),
        title: reviewTitle,
        spotifyInfo,
      });
  
      // Reset fields
      setPostContent('');
      setSpotifyLink('');
      setScore('');
      setReviewTitle('');
      setWriterName(user.fullName || user.username);
      setAddPostModalOpen(false);
      window.location.reload();
  
    } catch (error) {
      console.error('Error adding blog post:', error);
    }
  };  

  const navigate = useNavigate();

  const redirectToIndividualBlogPost = (title, author) => {
    const postRoute = `/blog/${encodeURIComponent(title)}/${encodeURIComponent(author)}`;
    navigate(postRoute);
  };

  return (
    <div>
      <title>Slaps N' Scraps | Blog</title>

      <h2 className='blogPageTitle'>User<span>Reviews</span></h2>

      <div className="blogSearch">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`searchInput ${isSearchActive ? 'active' : ''}`}
        />
        <button
          className="btn-search"
          onClick={() => {
            setSearchActive(true);
            inputRef.current?.focus();
          }}
        >
          <i className="fas fa-search"></i>
        </button>
      </div>

      <div className="blogContent">
        {blogPosts.map((post, index) => {
          // eslint-disable-next-line
          const isTrack = post.spotifyInfo?.trackTitle;
          const coverImage =
          post.spotifyInfo?.coverImage ||
          post.spotifyInfo?.trackCover ||
          post.spotifyInfo?.albumCover ||
          'default-cover-image-url';        
          const title = post.title?.trim() ? post.title : (post.spotifyInfo?.trackTitle || post.spotifyInfo?.albumTitle);
          // eslint-disable-next-line
          const artist =
            post.spotifyInfo?.artist || post.spotifyInfo?.albumArtists || post.author;

        

          return (
            <div key={index} className="blogPost" onClick={() => redirectToIndividualBlogPost(post.title, post.author)}>
              <div className="postContainer">
                <img
                  src={coverImage || 'default-cover-image-url'}
                  alt="Album Cover"
                  className="blogCoverImage"
                />
                <div className="postDetails">
                  <p className="blogReviewTitle">{title || post.title}</p>
                  <p className="blogAuthorName">By: {post.author}</p>
                  <p className="timestamp">
                    Posted on: {new Date(post.postTime).toLocaleString([], { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>


      {user && (
        <button
          className={`addPostButton ${isAddPostModalOpen ? 'active' : ''}`}
          onClick={() => setAddPostModalOpen((prevOpen) => !prevOpen)}
        >
          +
        </button>
      )}

      {isAddPostModalOpen && (
        <div className="addPostModal visible">
          <form>
            <legend className='formTitle'>Add a New Review</legend>

            <div className="inputs">
              <input
                type="text"
                className='spotifyLinkInput'
                placeholder='Spotify Link'
                value={spotifyLink}
                onChange={(e) => setSpotifyLink(e.target.value)}
              />
            </div>

            <div className="inputs">
              <label className='scoreLabel'>My Score: </label>
              <input
                type="text"
                className='scoreInput'
                placeholder='0.0'
                value={score}
                onChange={(e) => {
                  let input = e.target.value;
                  if (/^\d{2}$/.test(input)) {
                    input = `${input.slice(0, 1)}.${input.slice(1)}`;
                  }
                  const isValidInput = /^(\d{0,1}(\.\d{0,1})?)?$/.test(input);
                  if (isValidInput) {
                    setScore(input);
                    setScoreError('');
                  } else {
                    setScoreError('Please enter a valid score from 1 to 10.');
                  }
                }}
              />
              {scoreError && <p className='scoreErrorText'>{scoreError}</p>}
            </div>

            <div className="inputs">
              <input
                type="text"
                className='reviewTitleInput'
                placeholder='Title of the Review'
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
              />
            </div>

            <div className="inputs">
              <textarea
                className='blogPostInput'
                rows="4"
                placeholder='Write your review here. Please use <br> for line breaks...'
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
            </div>

            <div className="inputs">
              <label className='writerNameLabel'>By: </label>
              <input
                type="text"
                className='writerNameInput'
                placeholder="Author Name"
                value={writerName}
                onChange={(e) => setWriterName(e.target.value)}
                disabled
              />
            </div>

            <button className='submitButton' type="button" onClick={handleAddPost}>
              Add Review
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Blog;
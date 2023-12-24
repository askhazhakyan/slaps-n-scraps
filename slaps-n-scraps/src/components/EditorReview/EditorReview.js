import React, { useState, useEffect } from 'react';
import { firestore } from '../backend/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EditorReview = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [isAddPostModalOpen, setAddPostModalOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [score, setScore] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [writerName, setWriterName] = useState('');
  const [scoreError, setScoreError] = useState('');
  const [spotifyInfo, setSpotifyInfo] = useState({
    title: '',
    artist: '',
    coverImage: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const blogPostsCollection = collection(firestore, 'editorBlogs');
        const blogPostsSnapshot = await getDocs(blogPostsCollection);
        const posts = blogPostsSnapshot.docs.map((doc) => doc.data());
  
        // Filter posts based on the search query
        const filteredPosts = posts.filter((post) => {
          const searchRegex = new RegExp(searchQuery, 'i'); // Case-insensitive search
  
          // Check if the search query matches the author, title, or artist
          return (
            searchRegex.test(post.author) ||
            searchRegex.test(post.spotifyInfo?.linkTitle) ||
            searchRegex.test(post.spotifyInfo?.artist)
          );
        });
  
        // Sort the filtered posts by postTime in descending order (latest posts first)
        filteredPosts.sort((a, b) => b.postTime - a.postTime);
  
        setBlogPosts(filteredPosts);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      }
    };
  
    fetchBlogPosts();
  }, [searchQuery]);

  const handleAddPost = async () => {
    try {
      // Validate score using regex
      const scoreRegex = /^[0-9](\.[0-9])?$/;
      if (!scoreRegex.test(score)) {
        // If the score is not in the valid format, show an error message or handle it as needed
        console.error('Invalid score format. Please enter a valid score.');
        return;
      }
  
      // Validate Spotify link using regex
      const spotifyLinkRegex = /^https:\/\/open\.spotify\.com\/(track|album)\/[a-zA-Z0-9]+(?:\?[a-zA-Z0-9=&]*)?$/;

      if (!spotifyLinkRegex.test(spotifyLink)) {
        // If the Spotify link is not in the valid format, show an error message or handle it as needed
        console.error('Invalid Spotify link format. Please enter a valid Spotify link.');
        return;
      }
  
      // Check if the same author has already submitted a review for the same song/album
      const existingReviews = blogPosts.filter(
        (post) => post.author === writerName && post.link === spotifyLink
      );
  
      if (existingReviews.length > 0) {
        // If the author has already submitted a review for the same song/album, show an error message or handle it as needed
        console.error('You have already submitted a review for this song/album.');
        return;
      }

      let type, id;
      try {
        const url = new URL(spotifyLink);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        type = pathSegments[0];
        id = pathSegments[1];
      } catch (error) {
        console.error('Invalid Spotify link format. Please provide a valid track or album URL.');
        return;
      }
      
      // Fetch access token from Spotify
      const response = await axios('https://accounts.spotify.com/api/token', {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${process.env.REACT_APP_CLIENT_ID}:${process.env.REACT_APP_CLIENT_SECRET}`)}`,
        },
        data: 'grant_type=client_credentials',
      });
  
      const accessToken = response.data.access_token;
  
      // Determine the API endpoint based on the type (track or album)
      const apiEndpoint = type === 'track' ? 'tracks' : 'albums';
  
      // Fetch additional details from Spotify using the provided link and access token
      const spotifyResponse = await axios.get(`https://api.spotify.com/v1/${apiEndpoint}/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
  
      const spotifyInfo = {
        linkTitle: type === 'track' ? spotifyResponse.data.name : spotifyResponse.data.name,
        artist: type === 'track' ? spotifyResponse.data.artists.map((artist) => artist.name).join(', ') : spotifyResponse.data.artists.map((artist) => artist.name).join(', '),
        coverImage: type === 'track' ? spotifyResponse.data.album.images[0].url : spotifyResponse.data.images[0].url,
      };

      setSpotifyInfo(spotifyInfo);
  
      // Create a reference to the 'blogs' collection
      const blogsCollection = collection(firestore, 'editorBlogs');
  
      // Add a new document to the 'blogs' collection with the form data
      await addDoc(blogsCollection, {
        author: writerName,
        link: spotifyLink,
        postTime: Date.now(),
        review: postContent,
        score: parseFloat(score), // Convert score to a float
        title: reviewTitle,
        spotifyInfo: spotifyInfo, // Include Spotify information in the document
      });
  
      // Clear the input fields after successful submission
      setPostContent('');
      setSpotifyLink('');
      setScore('');
      setReviewTitle('');
      setWriterName('');
  
      // Close the modal
      setAddPostModalOpen(false);
  
      // Reload the page to reflect the newly added post (you may want to replace this with a more efficient update)
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
      {/* SLAPS N' SCRAPS Header */}
      <h1 className='snsLogo'>SLAPS <span>N'</span> SCRAPS</h1>

      <h2 className='blogPageTitle'>Editor<span>Reviews</span></h2>

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

      <div className="blogContent">
        {blogPosts.map((post, index) => (
          <div key={index} className="blogPost" onClick={() => redirectToIndividualBlogPost(post.title, post.author)}>
            {/* Layout for individual blog post */}
            <div className="postContainer">
              <img
                src={post.spotifyInfo?.coverImage || 'default-cover-image-url'}
                alt="Cover Image"
                className="blogCoverImage"
              />
              <div className="postDetails">
                <p className="blogReviewTitle">{post.title}</p>
                <p className="blogAuthorName">By: {post.author}</p>
                <p className="timestamp">Posted on: {new Date(post.postTime).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className={`addPostButton ${isAddPostModalOpen ? 'active' : ''}`}
        onClick={() => setAddPostModalOpen((prevOpen) => !prevOpen)}
      >
        +
      </button>

      {isAddPostModalOpen && (
        <div className="addPostModal visible">
          <form>
            <legend className='formTitle'>Add a New Review</legend>

            {/* Input for Spotify Link */}
            <div className="inputs">
              <input
                type="text"
                className='spotifyLinkInput'
                placeholder='Spotify Link'
                value={spotifyLink}
                onChange={(e) => setSpotifyLink(e.target.value)}
              />
            </div>

            {/* Input for Song / Album Score */}
            <div className="inputs">
              <label className='scoreLabel'>My Score: </label>
              <input
                type="text"
                className='scoreInput'
                placeholder='0.0'
                value={score}
                onChange={(e) => {
                  let input = e.target.value;

                  // Automatically insert a decimal if there are two digits without a decimal
                  if (/^\d{2}$/.test(input)) {
                    input = `${input.slice(0, 1)}.${input.slice(1)}`;
                  }

                  // Check if the input matches the desired pattern
                  const isValidInput = /^(\d{0,1}(\.\d{0,1})?)?$/.test(input);

                  // If the input is valid, update the score state
                  if (isValidInput) {
                    setScore(input);
                    setScoreError(''); // Clear previous error on input change
                  } else {
                    setScoreError('Please enter a valid score from 1 to 10.');
                  }
                }}
              />
              {scoreError && <p className='scoreErrorText'>{scoreError}</p>}
            </div>

            {/* Input for Review Title */}
            <div className="inputs">
              <input
                type="text"
                className='reviewTitleInput'
                placeholder='Title of the Review'
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
              />
            </div>

            {/* Input for Review Content */}
            <div className="inputs">
              <textarea
                className='blogPostInput'
                rows="4"
                placeholder='Write your review here. Please use <br> for line breaks...'
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
            </div>

            {/* Input for Writer's Name */}
            <div className="inputs">
              <label className='writerNameLabel'>By: </label>
              <input
                type="text"
                className='writerNameInput'
                placeholder="Author Name"
                value={writerName}
                onChange={(e) => setWriterName(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button className='submitButton' type="button" onClick={handleAddPost}>
              Add Review
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditorReview;
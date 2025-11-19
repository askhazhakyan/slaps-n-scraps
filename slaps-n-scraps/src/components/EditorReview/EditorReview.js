import React, { useState, useEffect, useRef } from 'react';
import { firestore } from '../backend/firebase';
import { collection, doc, getDoc, getDocs, addDoc } from 'firebase/firestore';
import { useUser, useClerk } from '@clerk/clerk-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EditorReview = () => {
  const { user } = useUser();
  const inputRef = useRef(null);
  const { openSignIn } = useClerk();

  const [blogPosts, setBlogPosts] = useState([]);
  const [isAddPostModalOpen, setAddPostModalOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [score, setScore] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [writerName, setWriterName] = useState(user ? user.fullName || user.username : '');
  const [scoreError, setScoreError] = useState('');
  const [spotifyInfo, setSpotifyInfo] = useState({
    title: '',
    artist: '',
    coverImage: '',
  });
  const [isSearchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [canAddPost, setCanAddPost] = useState(false);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const blogPostsCollection = collection(firestore, 'editorBlogs');
        const blogPostsSnapshot = await getDocs(blogPostsCollection);
        const posts = blogPostsSnapshot.docs.map((doc) => doc.data());

        const normalize = (str) =>
          str
            .toLowerCase()
            .replace(/[\s’'“”"`~!@#$%^&*()_+=\-[\]\\{}|;:,.<>/?]/g, '');

        const query = normalize(searchQuery);

        const filteredPosts = posts.filter((post) => {
          if (!query) return true;

          const author = normalize(post.author || '');
          const reviewTitle = normalize(post.title || '');
          const spotifyTitle = normalize(post.spotifyInfo?.linkTitle || '');
          const artist = normalize(post.spotifyInfo?.artist || '');

          return author.includes(query) || reviewTitle.includes(query) || spotifyTitle.includes(query) || artist.includes(query);
        });

        filteredPosts.sort((a, b) => b.postTime - a.postTime);
        setBlogPosts(filteredPosts);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      }

      try {
        if (!user) return;
        const userDocRef = doc(firestore, 'users', user.id);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setCanAddPost(userData?.editorAccount === true);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchBlogPosts();
  }, [searchQuery, user]);

  const handleAddPost = async () => {
    if (!user) {
      openSignIn();
      return;
    }

    try {
      const scoreRegex = /^[0-9](\.[0-9])?$/;
      if (!scoreRegex.test(score)) {
        console.error('Invalid score format. Please enter a valid score.');
        return;
      }

      const spotifyLinkRegex = /^https:\/\/open\.spotify\.com\/(track|album)\/[a-zA-Z0-9]+(?:\?[a-zA-Z0-9=&]*)?$/;
      if (!spotifyLinkRegex.test(spotifyLink)) {
        console.error('Invalid Spotify link format. Please enter a valid Spotify link.');
        return;
      }

      const existingReviews = blogPosts.filter(
        (post) => post.author === writerName && post.link === spotifyLink
      );

      if (existingReviews.length > 0) {
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

      const response = await axios('https://accounts.spotify.com/api/token', {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`)}`,
        },
        data: 'grant_type=client_credentials',
      });

      const accessToken = response.data.access_token;
      const apiEndpoint = type === 'track' ? 'tracks' : 'albums';

      const spotifyResponse = await axios.get(`https://api.spotify.com/v1/${apiEndpoint}/${id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      const spotifyInfo = {
        linkTitle: type === 'track' ? spotifyResponse.data.name : spotifyResponse.data.name,
        artist: type === 'track'
          ? spotifyResponse.data.artists.map((artist) => artist.name).join(', ')
          : spotifyResponse.data.artists.map((artist) => artist.name).join(', '),
        coverImage: type === 'track'
          ? spotifyResponse.data.album.images[0].url
          : spotifyResponse.data.images[0].url,
      };

      setSpotifyInfo(spotifyInfo);

      const blogsCollection = collection(firestore, 'editorBlogs');
      await addDoc(blogsCollection, {
        author: writerName,
        link: spotifyLink,
        postTime: Date.now(),
        review: postContent,
        score: parseFloat(score),
        title: reviewTitle,
        spotifyInfo: spotifyInfo,
      });

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
      <title>Slaps N' Scraps | Editorial</title>

      <h2 className='blogPageTitle'>Editor<span>Reviews</span></h2>

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
        {blogPosts.map((post, index) => (
          <div key={index} className="blogPost" onClick={() => redirectToIndividualBlogPost(post.title, post.author)}>
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
        style={{ display: canAddPost ? 'block' : 'none' }}
      >
        +
      </button>

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

export default EditorReview;
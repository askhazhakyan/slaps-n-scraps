import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../backend/firebase';
import { useUser, useClerk } from '@clerk/clerk-react';
import DOMPurify from 'dompurify';
import Slap from '../../images/slap.png';
import Scrap from '../../images/scraps.png';
import './IndividualBlog.css';

const IndividualBlogPost = () => {
  const { title, author } = useParams();
  const [post, setPost] = useState(null);
  const defaultCollectionName = 'blogs';
  const { user } = useUser();
  const { openSignIn } = useClerk();

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        const editorBlogPostsCollection = collection(firestore, 'editorBlogs');
        const editorBlogPostsSnapshot = await getDocs(editorBlogPostsCollection);
        const editorBlogPostData = editorBlogPostsSnapshot.docs
          .map((doc) => doc.data())
          .find((post) => post.title === title && post.author === author);

        const dynamicCollectionName = editorBlogPostData ? 'editorBlogs' : defaultCollectionName;

        const blogPostsCollection = collection(firestore, dynamicCollectionName);
        const blogPostsSnapshot = await getDocs(blogPostsCollection);

        const postData = blogPostsSnapshot.docs
          .map((doc) => doc.data())
          .find((post) => post.title === title && post.author === author);

        if (postData) setPost(postData);
        else console.error('Blog post not found.');
      } catch (error) {
        console.error('Error fetching individual blog post:', error);
      }
    };

    fetchBlogPost();
  }, [author, title]);

  if (!post) {
    return (
      <div id="trnt">
        <div className="trnt_turntable">
          <div className="trnt_floor"></div>
          <div className="trnt_arm"></div>
          <div className="trnt_vinyl">
            <div className="trnt_wheel trnt_wheel-1"></div>
            <div className="trnt_wheel trnt_wheel-2"></div>
            <div className="trnt_wheel trnt_wheel-3"></div>
            <div className="trnt_cover"></div>
            <div className="trnt_middle"></div>
            <div className="trnt_hole"></div>
          </div>
        </div>
        <span className='trnt_text'>Loading...</span>
      </div>
    );
  }

  const reviewContent = post.review.replace(/<br>/g, '<br><br>');
  const sanitizedContent = DOMPurify.sanitize(reviewContent);
  const isScoreBetween5And8 = post.score > 5 && post.score < 8;

  // Determine which info to display
  const spotifyInfo = post.spotifyInfo || {};
  const coverImage = spotifyInfo.coverImage || spotifyInfo.trackCover || spotifyInfo.albumCover || 'default-cover-image-url';
  const titleText = spotifyInfo.linkTitle || spotifyInfo.trackTitle || spotifyInfo.albumTitle || post.title;
  const artistText = spotifyInfo.artist || spotifyInfo.trackArtists || spotifyInfo.albumArtists || post.author;

  const isAlbum = !!(spotifyInfo.albumTitle || spotifyInfo.albumCover || spotifyInfo.albumArtists);

  return (
    <div>
      <title>Slaps N' Scraps | Blog</title>
      <div className="blogBody">
        <section className="header-container">
          <h2 className="type-title">{isAlbum ? 'Album Review' : 'Track Review'}</h2>
        </section>

        <div className="album-cover-container">
          <img className="album-cover-img" src={coverImage} alt="Track / Album Cover" />
        </div>

        <section className="blogLinkInfo">
          <p className="linkTitle">{titleText}</p>
          <p className="linkArtist">{artistText}</p>
          <p className="blog-author">Reviewed By: {post.author}</p>
        </section>

        <div className={`score-container ${post.score >= 8 ? 'slaps' : post.score <= 5 ? 'scraps' : ''}`}>
          {post.score >= 8 && <img className="score-image" src={Slap} alt="Slap Logo" style={{ top: '-2.5vw' }} />}
          {post.score <= 5 && <img className="score-image" src={Scrap} alt="Scrap Logo" style={{ top: '-2vw' }} />}
          <p
            className="blog-score"
            style={{
              position: 'absolute',
              top: post.score >= 8 ? '2.5vw' : post.score <= 5 ? '3vw' : '1.5vw',
              color: post.score >= 8 ? 'white' : '',
              left: post.score >= 8 ? '35%' : post.score <= 5 ? '50%' : '1.5vw',
              transform: post.score >= 8 ? 'translateX(-50%)' : post.score <= 5 ? 'translateX(-50%)' : '0',
              border: isScoreBetween5And8 ? '0.5vw solid #FE5F55' : '',
              borderRadius: isScoreBetween5And8 ? '50%' : '',
              height: isScoreBetween5And8 ? '4vw' : '',
              width: isScoreBetween5And8 ? '4vw' : '',
              padding: isScoreBetween5And8 ? '.75vw' : '',
              paddingTop: isScoreBetween5And8 ? '1.7vw' : '',
            }}
          >
            {post.score}
          </p>

          <div className="scoreTitleContainer">
            {post.score >= 8 && <p className="scoreTitle" style={{ top: '6vw', left: '.4vw' }}>SLAP!</p>}
            {post.score <= 5 && <p className="scoreTitle" style={{ top: '4.5vw', left: '0.4vw' }}>SCRAP!</p>}
          </div>
        </div>

        <section className="review-container">
          <p className="review-title">{post.title}</p>
          <p className="review-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }}></p>
          <p className="timestamp">
                    Posted on: {new Date(post.postTime).toLocaleString([], { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
          </p>
        </section>
      </div>
    </div>
  );
};

export default IndividualBlogPost;
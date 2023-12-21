import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../backend/firebase';
import DOMPurify from 'dompurify';
import Slap from '../../images/slap.png'
import Scrap from '../../images/scraps.png'
import './IndividualBlog.css'

const IndividualBlogPost = () => {

    const { title, author } = useParams();
    const { postId } = useParams();
    const [post, setPost] = useState(null);
  
    useEffect(() => {
      const fetchBlogPost = async () => {
        try {
          const blogPostsCollection = collection(firestore, 'blogs');
          const blogPostsSnapshot = await getDocs(blogPostsCollection);
  
          const postData = blogPostsSnapshot.docs
            .map((doc) => doc.data())
            .find((post) => post.title === title && post.author === author);
  
          if (postData) {
            setPost(postData);
          } else {
            console.error('Blog post not found.');
          }
        } catch (error) {
          console.error('Error fetching individual blog post:', error);
        }
      };
  
      fetchBlogPost();
    }, [postId, author, title]);
  
    console.log('Post data:', post);


  if (!post) {
    return (
        <div id="trnt">
          <div class="trnt_turntable">
            <div class="trnt_floor"></div>
            <div class="trnt_arm"></div>
            <div class="trnt_vinyl">
              <div class="trnt_wheel trnt_wheel-1"></div>
              <div class="trnt_wheel trnt_wheel-2"></div>
              <div class="trnt_wheel trnt_wheel-3"></div>
              <div class="trnt_cover"></div>
              <div class="trnt_middle"></div>
              <div class="trnt_hole"></div>
            </div>
          </div>
          <span className='trnt_text'>Loading...</span>
        </div>
      );
  }

  const reviewContent = post.review.replace(/<br>/g, '<br><br>');
  const sanitizedContent = DOMPurify.sanitize(reviewContent);
  const isScoreBetween5And8 = post.score > 5 && post.score < 8;

  return (
    <div>
      <div className='blogBody'>
        {/* Album cover image */}
        <div className="album-cover-container">
          <img className='album-cover-img' src={post.spotifyInfo?.coverImage || 'default-cover-image-url'} alt="Track / Album Cover" />
        </div>
    
        {/* Review section */}
        <section className="header-container">
          <h2 className="type-title">{post.link.includes('album') ? 'Album Review' : 'Track Review'}</h2>
        </section>

        <section className='blogLinkInfo'>
          <p className='linkTitle'>{post.spotifyInfo?.linkTitle}</p>
          <p className='linkArtist'>{post.spotifyInfo?.artist}</p>
          <p className="blog-author">Reviewed By: {post.author}</p>
        </section>
    
        {/* Spotify information section */}
        <div className={`score-container ${post.score >= 8 ? 'slaps' : post.score <= 5 ? 'scraps' : ''}`}>
          {post.score >= 8 && <img className='score-image' src={Slap} alt="Slap Logo" style={{top: '-2.5vw'}} />}
          {post.score <= 5 && <img className='score-image' src={Scrap} alt="Scrap Logo" style={{top: '-2vw'}}/>}
         <p
            className={`blog-score`}
            style={{
              position: 'absolute',
              top: post.score >= 8 ? '2.5vw' : post.score <= 5 ? '3vw' : '1.5vw',
              color: post.score >= 8 ? 'white' : '',
              left: post.score >= 8 ? '35%' : post.score <= 5 ? '50%' : '1.5vw',
              transform: post.score >= 8 ? 'translateX(-50%)': post.score <= 5 ? 'translateX(-50%)': '0',
              border: isScoreBetween5And8 ? '0.5vw solid #FE5F55' : '',
              borderRadius: isScoreBetween5And8 ? '50%' : '',
              height: isScoreBetween5And8 ? '4vw' : '',
              width: isScoreBetween5And8 ? '4vw' : '',
              padding: isScoreBetween5And8 ? '.75vw' : '',
              paddingTop: isScoreBetween5And8 ? '1.7vw' : ''
            }}
          >
            {post.score}
          </p>

          <div className="scoreTitleContainer">
            {post.score >= 8 && <p className='scoreTitle'  style={{top: '6vw', left:'.4vw'}}>SLAP!</p>}
            {post.score <= 5 && <p className='scoreTitle' style={{top: '4.5vw', left:'0.4vw'}}>SCRAP!</p>}
          </div>
        </div>

        <section className='review-container'>
          <p className="review-title">{post.title}</p>
          <p className="review-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }}></p>
          <p className="timestamp">Posted on: {new Date(post.postTime).toLocaleString()}</p>
        </section>
      </div>
    </div>
  );
};

export default IndividualBlogPost;

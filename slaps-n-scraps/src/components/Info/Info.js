import React, { useState, useEffect } from 'react';
import Logo from '../../images/logo.PNG';
import './Info.css';
import { useUser, useAuth } from '@clerk/clerk-react';

const Info = () => {
  // eslint-disable-next-line
  const { user } = useUser();
  // eslint-disable-next-line
  const { signOut } = useAuth();  

  // eslint-disable-next-line
  const [hideContent, setHideContent] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const element = document.querySelector('.rightContent');
      if (element) {
        const rect = element.getBoundingClientRect();
        let newOpacity = 1 - Math.max(0, 50 - rect.top) / 50;
        if (newOpacity < 0) newOpacity = 0;
        element.style.opacity = newOpacity;
      }
    };
  
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);  

  const gridItems = [
    {
      title: "Weekly Top Releases",
      text: (
        <>
          Stay up to date with the freshest tracks! Every week, we highlight the top 25 releases across genres, ensuring you never miss the slaps that everyone’s talking about.
        </>
      )
    },
    {
      title: "Customize Your Profile",
      text: (
        <>
          Make your profile your own! On your profile page, you can write a bio about your musical background, add your current <strong>Top 5 Artists</strong>, and share your tastes with the community. Let others see your unique perspective and discover new music through your favorites.
        </>
      )
    },
    {
      title: "Cast Your Vote",
      text: (
        <>
          Join the community and make your voice heard! With our Polls feature, you can listen to each song, vote if it’s a slap or a scrap, and even add new songs for others to review. Once a track reaches 100 votes, it’s scored as follows:
          <ul>
            <li><strong>75% or higher</strong> → Slap</li>
            <li><strong>50% or lower</strong> → Scrap</li>
          </ul>
          Be part of shaping the weekly hits!
        </>
      )
    },
    {
      title: "Write & Read Reviews",
      text: (
        <>
          Share your thoughts and opinions on your favorite tracks and albums! On the <strong>User Reviews</strong> page, you can write your own reviews for the community to see. Prefer professional insights? Check out the <strong>Editor Reviews</strong> page for thoughtfully crafted critiques from our editorial team, guiding you through the best slaps and scraps each week.
        </>
      )
    }
  ];

  return (
    <div className="infoContainer">
      <title>Slaps N' Scraps | About</title>
      <img src={Logo} alt="Site Logo" className="snsInfoLogo" />

      <div className="rightContent" style={{ opacity: hideContent ? 0 : 1 }}>
        <div className="missionStatement">
          <p className="missionTitle">Mission Statement</p>
          <p className="mission">
            At Slaps and Scraps, we are dedicated to providing a discerning platform for music enthusiasts seeking insightful 
            and unbiased reviews. Our mission is to cultivate a community where the appreciation of music is enriched through thoughtful critique 
            and analysis. By delivering meticulously crafted reviews, our site aims to guide audiences in discovering exceptional music across genres, 
            celebrating the slaps that resonate and offering constructive insights into areas that may fall short—the scraps. 
            Committed to integrity and professionalism, Slaps and Scraps is poised to be a trusted destination for individuals passionate about the 
            transformative power of musical expression.
          </p>
        </div>

        <div className="infoGrid">
          {gridItems.map((item, index) => (
            <div key={index} className="gridItem">
              <h3 className="gridTitle">{item.title}</h3>
              <p className="gridText">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Info;
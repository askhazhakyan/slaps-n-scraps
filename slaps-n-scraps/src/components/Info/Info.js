import React from 'react'
import Logo from '../../images/logo.PNG'
import './Info.css'
import { useUser, useAuth } from '@clerk/clerk-react';

const Info = () => {
  const { user } = useUser();
  const { signOut } = useAuth();  
  return (
    <div>
        <title>Slaps N' Scraps | About</title>
        <div className="missionStatement">
            <p className="missionTitle">Mission Statement:</p>
            <p className="mission">At Slaps and Scraps, we are dedicated to providing a discerning platform for music enthusiasts seeking insightful 
            and unbiased reviews. Our mission is to cultivate a community where the appreciation of music is enriched through thoughtful critique 
            and analysis. By delivering meticulously crafted reviews, our site aims to guide audiences in discovering exceptional music across genres, 
            celebrating the 'slaps' that resonate and offering constructive insights into areas that may fall short—the 'scraps.' 
            Committed to integrity and professionalism, Slaps and Scraps is poised to be a trusted destination for individuals passionate about the 
            transformative power of musical expression.</p>
        </div>
        <img src={Logo} alt="Site Logo" className="snsInfoLogo" />
    </div>
  )
}

export default Info
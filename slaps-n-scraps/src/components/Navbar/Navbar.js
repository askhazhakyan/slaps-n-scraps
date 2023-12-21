import React from 'react';
import HomeLogo from '../../images/navbar_icons/home_icon.png';
import SlapsLogo from '../../images/navbar_icons/slaps_icon.png';
import ScrapsLogo from '../../images/navbar_icons/scraps_icon.png';
import ReviewLogo from '../../images/navbar_icons/review_icon.png';
import PollLogo from '../../images/navbar_icons/poll_icon.png';
import BlogLogo from '../../images/navbar_icons/blog_icon.png';
import InfoLogo from '../../images/navbar_icons/info_icon.png';

const Navbar = () => {
  return (
    <div>
        <div class="hamburger-menu">
            <input id="menu__toggle" type="checkbox" />
            <label class="menu__btn" for="menu__toggle">
            <span></span>
            </label>

            <ul class="menu__box">
            <li><a class="menu__item" id='home' href="/"><img src={HomeLogo} alt="Home" /></a></li>
            <li><a class="menu__item" href="/polls"><img src={PollLogo} alt="User Polls" /></a></li>
            <li><a class="menu__item" href="/slaps"><img src={SlapsLogo} alt="Slaps" /></a></li>
            <li><a class="menu__item" href="/scraps"><img src={ScrapsLogo} alt="Scraps" /></a></li>
            <li><a class="menu__item" href="/#"><img src={ReviewLogo} alt="Reviews" /></a></li>
            <li><a class="menu__item" href="/blog"><img src={BlogLogo} alt="Blog" /></a></li>
            <li><a class="menu__item" href="/info"><img src={InfoLogo} alt="Info" /></a></li>
            </ul>
        </div>
    </div>
  )
}

export default Navbar
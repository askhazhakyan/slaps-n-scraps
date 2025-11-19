import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';

import HomeLogo from '../../images/navbar_icons/home_icon.png';
import SlapsLogo from '../../images/navbar_icons/slaps_icon.png';
import ScrapsLogo from '../../images/navbar_icons/scraps_icon.png';
import ReviewLogo from '../../images/navbar_icons/review_icon.png';
import PollLogo from '../../images/navbar_icons/poll_icon.png';
import BlogLogo from '../../images/navbar_icons/blog_icon.png';
import InfoLogo from '../../images/navbar_icons/info_icon.png';

const Navbar = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const menuToggleRef = useRef(null);

  const handleLinkClick = () => {
    // Uncheck the menu toggle so the menu closes
    if (menuToggleRef.current) menuToggleRef.current.checked = false;
  };

  return (
    <div>
      <div className="hamburger-menu">
        <input id="menu__toggle" type="checkbox" ref={menuToggleRef} />
        <label className="menu__btn" htmlFor="menu__toggle">
          <span></span>
        </label>

        <ul className="menu__box">
          <li>
            <Link className="menu__item" id='home' to="/" onClick={handleLinkClick}><img src={HomeLogo} alt="Home" />
              <span className="menu__text">Home</span>
            </Link>
          </li>
          <li>
            <Link className="menu__item" to="/polls" onClick={handleLinkClick}><img src={PollLogo} alt="User Polls" />
              <span className="menu__text">Polls</span>
            </Link>
          </li>
          <li>
            <Link className="menu__item" to="/slaps" onClick={handleLinkClick}><img src={SlapsLogo} alt="Slaps" />
              <span className="menu__text">Weekly Slaps</span>
            </Link>
          </li>
          <li>
            <Link className="menu__item" to="/scraps" onClick={handleLinkClick}><img src={ScrapsLogo} alt="Scraps" />
              <span className="menu__text">Weekly Scraps</span>
            </Link>
          </li>
          <li>
            <Link className="menu__item" to="/editorReview" onClick={handleLinkClick}><img src={ReviewLogo} alt="Reviews" />
              <span className="menu__text">Editor Column</span>
            </Link>
          </li>
          <li>
            <Link className="menu__item" to="/blog" onClick={handleLinkClick}><img src={BlogLogo} alt="Blog" />
              <span className="menu__text">User Reviews</span>
            </Link>
          </li>
          <li>
            <Link className="menu__item" to="/info" onClick={handleLinkClick}><img src={InfoLogo} alt="Info" />
              <span className="menu__text">About</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
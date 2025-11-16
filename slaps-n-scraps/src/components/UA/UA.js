import React, { useState, useEffect, useRef } from 'react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
  useAuth
} from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './UA.css';

const UA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useAuth();
  const [showProfileBtn, setShowProfileBtn] = useState(false);
  const containerRef = useRef(null);

  const handleToggleProfile = () => {
    if (location.pathname !== '/profile') {
      setShowProfileBtn((s) => !s);
    }
  };

  const handleVisitProfile = () => {
    if (!user) return;
    setShowProfileBtn(false);
    navigate(`/profile/${user.username}`);
  };

  const handleSignOut = async () => {
    setShowProfileBtn(false);
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowProfileBtn(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="ua-wrapper">
      <SignedOut>
        <div className="ua-auth-buttons">
          <SignInButton mode="modal">
            <button className="loginButton">Login</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="ua-profile-container" ref={containerRef}>
          {location.pathname !== '/profile' ? (
            <div
              className="ua-avatar-click-area"
              onClick={handleToggleProfile}
              role="button"
              aria-label="Toggle profile actions"
            >
              <img
                src={user?.imageUrl}
                alt={user?.fullName || 'Profile'}
                className="ua-avatar-image"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div className="ua-userbutton-wrapper">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    rootBox: 'ua-userbutton-root',
                    avatarBox: 'ua-userbutton-avatar',
                  },
                }}
              />
            </div>
          )}

          <div
            className={`ua-visit-btn ${showProfileBtn && location.pathname !== '/profile' ? 'show' : ''}`}
            aria-hidden={!showProfileBtn}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0 }}
          >
            <button
              onClick={handleVisitProfile}
              style={{
                width: '100%',
                padding: '0.45rem 0.8rem',
                border: 'none',
                borderBottom: '1px solid #cbced1',
                borderRadius: '8px 8px 0 0',
                background: '#f7f7ff',
                fontVariant: 'all-small-caps',
                cursor: 'pointer'
              }}
            >
              Visit Profile
            </button>

            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                padding: '0.45rem 0.8rem',
                border: 'none',
                borderRadius: '0 0 8px 8px',
                background: '#f7f7ff',
                fontVariant: 'all-small-caps',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </SignedIn>
    </div>
  );
};

export default UA;
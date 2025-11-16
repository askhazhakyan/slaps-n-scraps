// App.js
import React from 'react';
import { Routes, Route, useLocation, matchPath } from 'react-router-dom';
import Home from './components/Home/Home';
import Slaps from './components/Slaps/Slaps';
import Scraps from './components/Scraps/Scraps';
import Polls from './components/Polls/Polls';
import Blogs from './components/Blog/Blog';
import IndividualBlog from './components/IndividualBlog/IndividualBlog';
import Info from './components/Info/Info';
import EditorReview from './components/EditorReview/EditorReview';
import Profile from './components/Profile/Profile';
import Navbar from './components/Navbar/Navbar';
import UA from './components/UA/UA';
import { AuthProvider } from './components/UA/AuthContext';
import './App.css';
import './components/Navbar/Navbar.css';

function App() {
  const location = useLocation();

  const hideLogoRoutes = [
    '/blog/:title/:author',
    '/profile/:username',
  ];

  const hideLogo = hideLogoRoutes.some((path) => matchPath({ path, end: true }, location.pathname));

  return (
    <div className="App">
      {!hideLogo && <h1 className='siteLogo'>SLAPS <span> N' </span> SCRAPS</h1>}
      <AuthProvider>
        <div>
          <Navbar />
          <UA />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/slaps" element={<Slaps />} />
            <Route path="/scraps" element={<Scraps />} />
            <Route path="/polls" element={<Polls />} />
            <Route path="/blog" element={<Blogs />} />
            <Route path="/blog/:title/:author" element={<IndividualBlog />} />
            <Route path="/info" element={<Info />} />
            <Route path="/editorReview" element={<EditorReview />} />
            <Route path="/profile/:username" element={<Profile />} />
          </Routes>
        </div>
      </AuthProvider>
    </div>
  );
}

export default App;
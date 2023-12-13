import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
// import Landing from './components/Landing/Landing';
import Home from './components/Home/Home';
import Slaps from './components/Slaps/Slaps';
import Scraps from './components/Scraps/Scraps';
import Polls from './components/Polls/Polls'
import Blogs from './components/Blog/Blog'
import './App.css'
import Navbar from './components/Navbar/Navbar'
import './components/Navbar/Navbar.css'

const router = createBrowserRouter([
  {
    path:"/",
    element:<span>{<Home/>}</span>
  },
  {
    path:"/slaps",
    element:<span>{<Slaps/>}</span>
  },
  {
    path:"/scraps",
    element:<span>{<Scraps/>}</span>
  },
  {
    path:"/polls",
    element:<span>{<Polls/>}</span>
  },
  {
    path:"/blog",
    element:<span>{<Blogs/>}</span>
  },
])

function App() {
  return (
    <div className="App">
      <div>
        <div>
          {<Navbar/>}
        </div>
        <RouterProvider router={router} />
      </div>
    </div>
  );
}

export default App;

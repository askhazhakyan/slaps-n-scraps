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
import IndividualBlog from './components/IndividualBlog/IndividualBlog'
import Info from './components/Info/Info'
import EditorReview from './components/EditorReview/EditorReview'
import './App.css'
import Navbar from './components/Navbar/Navbar'
import './components/Navbar/Navbar.css'

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/slaps", element: <Slaps /> },
  { path: "/scraps", element: <Scraps /> },
  { path: "/polls", element: <Polls /> },
  { path: "/blog", element: <Blogs /> },
  { path: "/blog/:title/:author", element: <IndividualBlog /> },
  { path: "/info", element: <Info /> },
  { path: "/editorReview", element: <EditorReview /> },
]);

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

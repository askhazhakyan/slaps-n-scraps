import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Landing from './components/Landing/Landing';
import Slaps from'./components/Slaps/Slaps';
import './App.css'

const router = createBrowserRouter([
  {
    path:"/",
    element:<span>{<Landing/>}</span>
  },
  {
    path:"/slaps",
    element:<span>{<Slaps/>}</span>
  },
])

function App() {
  return (
    <div className="App">
      <div>
        <RouterProvider router={router} />
      </div>
    </div>
  );
}

export default App;

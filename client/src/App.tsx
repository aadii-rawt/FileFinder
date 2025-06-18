import Dashboard from "./pages/Dashboard";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./Layout/Layout";
import Search from "./pages/Search";
import Trash from "./pages/Trash";
import Recent from "./pages/Recent";

function App() {
  const router = createBrowserRouter([
    {
      path: "",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <Dashboard />
        },
        {
          path : "/folder/:folderId",
          element: <Dashboard />
        },
        {
          path: "/search",
          element: <Search />
        },
        {
          path: "/recent",
          element: <Recent />
        },
        {
          path: "/trash",
          element: <Trash />
        }
      ]
    }
  ])

  return (
    <RouterProvider router={router} />
  );
}

export default App;

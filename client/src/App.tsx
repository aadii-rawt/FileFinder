import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './Layout/Layout'
import Dashboard from './pages/Dashboard'
import SearchPage from './pages/Search'
import Recent from './pages/Recent'
import Trash from './pages/Trash'
import SigninLayout from './components/SigninLayout'
import Login from './pages/Login'
import VerifyOtp from './pages/VerifyOtp'
import Signup from './pages/Signup'

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
          path: "/folder/:folderId",
          element: <Dashboard />
        },
        {
          path: "/search",
          element: <SearchPage />
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
    },
    {
      path: "/login",
      element: (
        <SigninLayout>
          <Login />
        </SigninLayout>
      ),
    },
    {
      path: "/signup",
      element: (
        <SigninLayout>
          <Signup />
        </SigninLayout>
      ),
    },
    {
      path: "/verify/email",
      element: (
        <SigninLayout>
          <VerifyOtp />
        </SigninLayout>
      ),
    },

  ])

  return (
    <RouterProvider router={router} />
  )
}

export default App

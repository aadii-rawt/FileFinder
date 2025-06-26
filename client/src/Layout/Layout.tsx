import { Outlet, useNavigate } from "react-router-dom";
import useAuthContext from "../context/userContext";
import { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const Layout: React.FC = () => {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // ✅ Prevent rendering until loading is done
  if (loading) return null;

  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1 w-full overflow-hidden">
        <Header />
        <Outlet />
      </div>
    </div>
  );
};

export default Layout

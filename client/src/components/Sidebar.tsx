import { NavLink } from "react-router-dom";
import { FaHome, FaClock, FaTrash } from "react-icons/fa";
import { RiHome2Line } from "react-icons/ri";
import { FiClock } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";

const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-white sticky top-0 left-0 z-20 flex flex-col pt-6">

      <h1 className="text-xl font-semibold px-6 mb-6">🗂️ My Drive</h1>



      <nav className="flex flex-col gap-2 px-2 mt-5">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg   cursor-pointer
            ${isActive ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`
          }
        >
          <RiHome2Line size={20}  />
          Home
        </NavLink>

        <NavLink
          to="/recent"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg  cursor-pointer
            ${isActive ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`
          }
        >
        <FiClock size={20}  />
          Recent
        </NavLink>

        <NavLink
          to="/trash"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg  cursor-pointer
            ${isActive ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`
          }
        >
         <MdDeleteOutline size={22} />
          Bin
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;

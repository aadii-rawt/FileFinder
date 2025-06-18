import { useState, useRef, useEffect } from "react";
import { NavLink, useParams } from "react-router-dom";
import { RiHome2Line } from "react-icons/ri";
import { FiClock } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";
import { IoIosAdd } from "react-icons/io";
import axios from "../utils/axios";

const Sidebar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const { folderId } = useParams();

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    await axios.post("/folders", { name: folderName, parent: folderId || null });
    setFolderName("");
    setShowModal(false);
    window.location.reload();
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("parent", folderId || "");

    await axios.post("/upload", formData);
    window.location.reload();
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Example: Just logging for now
    console.log("Uploading folder with files:", files);
    // Here you can loop and call your API
  };

  return (
    <aside className="w-64 h-screen bg-white sticky top-0 left-0 z-20 flex flex-col pt-6">

      <div className="px-6 mb-6">

        <img className="w-18" src="/logo.png" alt="" />
      </div>

      <div className="relative px-2">
        <button
          onClick={() => setShowMenu((prev) => !prev)}
          className="flex items-center px-10 py-2 shadow cursor-pointer bg-blue-200 rounded ml-2"
        >
          <span className="ml-1 text-xl">New</span>
        </button>

        {showMenu && (
          <div
            ref={menuRef}
            className="absolute top-0 left-8 bg-white shadow rounded w-48  z-30"
          >
            <button
              onClick={() => {
                setShowModal(true);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer"
            >
              ➕ New Folder
            </button>

            <button
              onClick={() => {
                fileInputRef.current?.click();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer"
            >
              ⬆️ File Upload
            </button>

            <button
              onClick={() => {
                folderInputRef.current?.click();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer"
            >
              📁 Folder Upload
            </button>
          </div>
        )}
      </div>

      <nav className="flex flex-col gap-2 px-2 mt-5">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer ${isActive ? "bg-blue-500 text-white" : "hover:bg-gray-100"
            }`
          }
        >
          <RiHome2Line size={20} />
          Home
        </NavLink>

        <NavLink
          to="/recent"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer ${isActive ? "bg-blue-500 text-white" : "hover:bg-gray-100"
            }`
          }
        >
          <FiClock size={20} />
          Recent
        </NavLink>

        <NavLink
          to="/trash"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer ${isActive ? "bg-blue-500 text-white" : "hover:bg-gray-100"
            }`
          }
        >
          <MdDeleteOutline size={22} />
          Bin
        </NavLink>
      </nav>

      {/* File Upload */}
      <input
        type="file"
        ref={fileInputRef}
        hidden
        onChange={handleFileUpload}
      />

      {/* Folder Upload */}
      <input
        type="file"
        ref={folderInputRef}
        hidden
        webkitdirectory="true"
        directory=""
        onChange={handleFolderUpload}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-transparent  bg-opacity-40  z-40">
          <div className="bg-black/20 w-full h-full flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow w-96">
              <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="border px-3 py-2 w-full rounded mb-4"
              />
              <div className="flex justify-end gap-3 text-blue-700 ">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2  rounded hover:bg-blue-100/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 rounded hover:bg-blue-100/50"
                >
                  Create
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

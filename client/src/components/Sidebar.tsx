import { useState, useRef, useEffect } from "react";
import { NavLink, useParams } from "react-router-dom";
import { RiHome2Line } from "react-icons/ri";
import { FiClock, FiFilePlus } from "react-icons/fi";
import { MdDeleteOutline, MdDriveFolderUpload, MdOutlineCreateNewFolder } from "react-icons/md";
import axios from "../utils/axios";
import useAuthContext from "../context/userContext";

const Sidebar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { setUploadQueue } = useAuthContext()

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

    // Push to upload queue
    setUploadQueue((prev: File[]) => [...prev, file]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("parent", folderId || "");

    try {
      await axios.post("/upload", formData);
      console.log("✅ File uploaded:", file.name);
    } catch (err) {
      console.error("Upload failed:", err);
    }

    // Remove from queue
    setUploadQueue((prev: File[]) => prev.filter((f) => f.name !== file.name));
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    console.log("Selected files:", files.map(f => (f as any).webkitRelativePath));

    const folderMap = new Map(); // Map full path → folderId

    // 1️⃣ First create TOP folder
    const firstPath = (files[0] as any).webkitRelativePath;
    const topFolderName = firstPath.split("/")[0];

    const topFolderRes = await axios.post("/folders", {
      name: topFolderName,
      parent: folderId || null, // current folder
    });

    const topFolderId = topFolderRes.data._id;
    folderMap.set(topFolderName, topFolderId);

    console.log("📂 Created top folder:", topFolderName, topFolderId);

    // 2️⃣ Process all paths → build folder tree
    for (const file of files) {
      const relativePath = (file as any).webkitRelativePath; // e.g. Images/Docs/file1.pdf
      const pathParts = relativePath.split("/");
      const fileName = pathParts.pop(); // remove file name

      let currentParentId = topFolderId;
      let currentPath = topFolderName;

      // For each folder level
      for (let i = 1; i < pathParts.length; i++) {
        currentPath = pathParts.slice(0, i + 1).join("/"); // e.g. Images/Docs

        if (!folderMap.has(currentPath)) {
          // Create folder
          const folderName = pathParts[i];

          const folderRes = await axios.post("/folders", {
            name: folderName,
            parent: currentParentId,
          });

          const newFolderId = folderRes.data._id;
          folderMap.set(currentPath, newFolderId);
          currentParentId = newFolderId;

          console.log("📂 Created subfolder:", currentPath, newFolderId);
        } else {
          currentParentId = folderMap.get(currentPath);
        }
      }

      // 3️⃣ Upload file to correct parent
      setUploadQueue((prev: File[]) => [...prev, file]);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("parent", currentParentId);

      try {
        await axios.post("/upload", formData);
        console.log("✅ Uploaded file:", file.name, "→ Parent:", currentParentId);
      } catch (err) {
        console.error("Upload failed:", err);
      }

      setUploadQueue((prev: File[]) => prev.filter((f) => f.name !== file.name));
    }
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
            className="absolute top-0 left-8 bg-white shadow-lg rounded w-48  z-30"
          >
            <button
              onClick={() => {
                setShowModal(true);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer flex items-center gap-3 "
            >
              <MdOutlineCreateNewFolder size={20} /> New Folder
            </button>

            <button
              onClick={() => {
                fileInputRef.current?.click();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer flex items-center gap-3"
            >
              <FiFilePlus size={20} /> File Upload
            </button>

            <button
              onClick={() => {
                folderInputRef.current?.click();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer flex items-center gap-3"
            >
              <MdDriveFolderUpload size={20} /> Folder Upload
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
          Trash
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

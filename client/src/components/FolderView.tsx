import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../utils/axios";
import FileCard from "./FileCard";
import Masonry from "react-masonry-css";
import useAuthContext from "../context/userContext";
import { FaFolder, FaEllipsisV } from "react-icons/fa";
import { MdKeyboardArrowRight } from "react-icons/md";
import { HiOutlineDotsVertical } from "react-icons/hi";

interface Folder {
  _id: string;
  name: string;
  parent?: string | null;
}

interface FileType {
  _id: string;
  filename: string;
  url: string;
  type: string;
  geminiText: string;
}

const FolderView = () => {
  const { folderId } = useParams(); // current folderId from URL
  const navigate = useNavigate();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileType[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const { setPreviewFile } = useAuthContext();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    const resFolders = await axios.get(`/folders`, {
      params: { parent: folderId || null },
    });
    const resFiles = await axios.get(`/files`, {
      params: { parent: folderId || null },
    });

    setFolders(resFolders.data);
    setFiles(resFiles.data);

    // fetch breadcrumbs
    if (folderId) {
      const chain: Folder[] = [];
      let currentId: string | null = folderId;

      while (currentId) {
        const res = await axios.get(`/folders/${currentId}`);
        const folder: Folder = res.data;
        chain.unshift(folder); // add to start
        currentId = folder.parent || null;
      }

      setBreadcrumbs(chain);
    } else {
      setBreadcrumbs([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [folderId]);

  const handleRenameFolder = async (id: string) => {
    const newName = prompt("Enter new folder name:");
    if (newName?.trim()) {
      await axios.put(`/folders/${id}`, { name: newName });
      fetchData();
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (confirm("Move folder to Trash?")) {
      await axios.delete(`/folders/${id}`);
      fetchData();
    }
  };

  // CLOSE CONTEXT MENU on outside click:
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="p-4 bg-gray-100">
      {/* BREADCRUMB */}
      <div className="mb-4 flex flex-wrap gap-2 text-xl items-center">
        <button
          onClick={() => navigate("/")}
          className="cursor-pointer text-gray-600 hover:text-black"
        >
          My Drive
        </button>
        {breadcrumbs.map((f, idx) => (
          <div key={f._id} className="flex items-center gap-1">
            <span>
              <MdKeyboardArrowRight size={23} />
            </span>
            <button
              onClick={() => navigate(`/folder/${f._id}`)}
              className={`cursor-pointer ${
                idx === breadcrumbs.length - 1
                  ? "text-black"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              {f.name}
            </button>
          </div>
        ))}
      </div>

      {/* Folders */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {folders.map((f) => (
          <div
            key={f._id}
            className="relative p-4 shadow bg-white rounded-xl flex justify-between items-center"
          >
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/folder/${f._id}`)}
            >
              <FaFolder size={20} className="text-amber-300" />
              <span className="font-medium">{f.name}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation(); // don't trigger folder click
                setActiveMenu((prev) => (prev === f._id ? null : f._id));
              }}
              className="p-1 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <HiOutlineDotsVertical  size={18} />
            </button>

            {activeMenu === f._id && (
              <div
                ref={menuRef}
                className="absolute right-2 top-12 bg-gray-50 shadow rounded text-sm w-40 z-10"
              >
                <button
                  onClick={() => {
                    handleRenameFolder(f._id);
                    setActiveMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer"
                >
                  Rename
                </button>
                <button
                  onClick={() => {
                    handleDeleteFolder(f._id);
                    setActiveMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 cursor-pointer"
                >
                  Move to Trash
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Files */}
      <Masonry
        breakpointCols={{ default: 3, 1100: 3, 700: 2, 500: 1 }}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {files.map((f) => (
          <FileCard key={f._id} file={f} onPreview={() => setPreviewFile(f)} />
        ))}
      </Masonry>
    </div>
  );
};

export default FolderView;

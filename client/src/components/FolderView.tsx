import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../utils/axios";
import FileCard from "./FileCard";
import Masonry from "react-masonry-css";
import useAuthContext from "../context/userContext";
import { FaFolder, FaEllipsisV } from "react-icons/fa";
import { MdKeyboardArrowRight } from "react-icons/md";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { IoIosMenu } from "react-icons/io";
import { CiGrid41 } from "react-icons/ci";

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

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
      await axios.patch(`/folders/${id}/trash`);
      fetchData(); // refresh
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
      <div className="flex items-center justify-between">
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
                className={`cursor-pointer ${idx === breadcrumbs.length - 1
                  ? "text-black"
                  : "text-gray-600 hover:text-black"
                  }`}
              >
                {f.name}
              </button>
            </div>
          ))}
        </div>

        <div className="flex border rounded-3xl overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className="border-r px-4 py-2 text-sm bg-white shadow"
          >
            <IoIosMenu size={24} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className="rounded-r-xl px-4 py-2 rounded text-sm bg-white shadow"
          >
          <CiGrid41 size={24}/>
          </button>
        </div>
      </div>

      {/* Folders */}
      <div className={`mt-5 ${viewMode === "list" ? "divide-y rounded" : "grid grid-cols-2 md:grid-cols-4 gap-4  mb-4"}`}>
        {folders.map((f) => (
          <div
            key={f._id}
            className={`flex items-center justify-between p-4 cursor-pointer ${viewMode === "list" ? "hover:bg-gray-50 border-t border-gray-300 last:border-none" : "shadow bg-white rounded-xl"
              }`}
            onClick={() => navigate(`/folder/${f._id}`)}
          >
            <div className="flex items-center gap-3">
              <FaFolder size={20} className="text-amber-300" />
              <span className="font-medium">{f.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Files */}
      {viewMode === "grid" ? (
        <Masonry
          breakpointCols={{ default: 3, 1100: 3, 700: 2, 500: 1 }}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {files.map((f) => (
            <FileCard key={f._id} file={f} onPreview={() => setPreviewFile(f)} />
          ))}
        </Masonry>
      ) : (
        <div className="divide-y border-t border-gray-300">
          {files.map((f) => (
            <div
              key={f._id}
              className="flex justify-between items-center p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPreviewFile(f)}>
                <span className="font-medium">{f.filename}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default FolderView;

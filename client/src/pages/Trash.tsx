import { useEffect, useRef, useState } from "react";
import axios from "../utils/axios";
import { FaFolder } from "react-icons/fa";
import FileCard from "../components/FileCard";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { MdOutlineDeleteForever, MdRestore } from "react-icons/md";

interface Folder {
  _id: string;
  name: string;
}

interface FileType {
  _id: string;
  filename: string;
  url: string;
  type: string;
  geminiText: string;
}

const Trash: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileType[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchTrash = async () => {
    try {
      const res = await axios.get("/trash");
      setFolders(res.data.trashedFolders);
      setFiles(res.data.trashedFiles);
    } catch (err) {
      console.error("Failed to fetch trash:", err);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestoreFolder = async (id: string) => {
    if (confirm("Move folder to Trash?")) {
      await axios.patch(`/folders/${id}/restore`);
    }
  };

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
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-semibold mb-6">Trash</h2>

      {/* Folders */}
      {folders.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-3">Folders</h3>
          <div className={`mt-5 grid grid-cols-2 md:grid-cols-4 gap-4  mb-4`}>
            {folders.map((f) => (
              <div
                key={f._id}
                className={`relative flex items-center justify-between p-4 cursor-pointer shadow bg-white rounded-xl`}
              >
                <div className="flex items-center gap-3">
                  <FaFolder size={20} className="text-amber-300" />
                  <span className="font-medium">{f.name}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu((prev) => (prev === f._id ? null : f._id));
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  <HiOutlineDotsVertical size={18} />
                </button>

                {activeMenu === f._id && (
                  <div
                    ref={menuRef}
                    className="absolute right-2 top-12 bg-gray-50 shadow rounded text-sm w-40 z-10"
                  >
                    <button
                      onClick={() => {
                        handleRestoreFolder(f._id);
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer  flex items-center gap-2"
                    >
                     <MdRestore /> Restore
                    </button>
                    <button
                      onClick={() => {
                        handleRestoreFolder(f._id);
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer  flex items-center gap-2"
                    >
                     <MdOutlineDeleteForever  /> Delete forever
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Files */}
      {files.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-3">Files</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((f) => (
              <FileCard key={f._id} file={f} onPreview={() => { }} />
            ))}
          </div>
        </>
      )}

      {folders.length === 0 && files.length === 0 && (
        <p className="text-center text-gray-500 mt-12">Trash is empty 🎉</p>
      )}
    </div>
  );
};

export default Trash;

import { useEffect, useRef, useState } from "react";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { FaEllipsisV, FaRegImage } from "react-icons/fa";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { LiaEdit } from "react-icons/lia";
import { MdDeleteOutline, MdOutlineFileDownload } from "react-icons/md";

interface Props {
  file: {
    _id: string;
    filename: string;
    url: string;
    type: string;
    geminiText: string;
  };
  onPreview: () => void;
  onRename: (id: string, originalName: string) => void;
  onDelete: (id: string) => void;
  onDownload: (url: string, filename: string) => void;
}

const FileCard = ({ file, onPreview, onRename, onDownload }: Props) => {
  const [showMenu, setShowMenu] = useState(false);
  const isImage = file.type.startsWith("image");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click:
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

  const handleDownload = async (file) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.filename;
      link.click();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className="relative p-3 rounded-xl shadow-sm bg-white my-3">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium truncate cursor-pointer" onClick={onPreview}>
          <div className="flex items-center gap-3">
            <FaRegImage size={20} className="text-red-500" />
            <span className="font-medium">{file.filename}</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((prev) => !prev);
          }}
          className="p-1 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <HiOutlineDotsVertical size={18} />
        </button>
      </div>

      {isImage ? (
        <img
          src={file.url}
          alt={file.filename}
          className="w-full rounded cursor-pointer"
          onClick={onPreview}
        />
      ) : (
        <a href={file.url} target="_blank" className="text-blue-600 underline text-sm">
          View File
        </a>
      )}

      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-2 top-10 bg-gray-50 rounded text-sm shadow w-40 z-10"
        >
          <button
            onClick={() => {
              // onDownload(file.url, file.filename);
              handleDownload(file)
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer  flex items-center gap-2"
          >
            <MdOutlineFileDownload /> Download
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer  flex items-center gap-2"

            onClick={() => {
              onRename(file._id, file.filename);
              setShowMenu(false);
            }}
          >
            <LiaEdit /> Rename
          </button>

          <button
            onClick={() => {
              onDelete(file._id);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer  flex items-center gap-2"
          >
            <MdDeleteOutline />  Move to Trash
          </button>
        </div>
      )}
    </div>
  );
};

export default FileCard;

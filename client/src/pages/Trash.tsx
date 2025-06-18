import { useEffect, useState } from "react";
import axios from "../utils/axios";
import { FaFolder } from "react-icons/fa";
import FileCard from "../components/FileCard";

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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-semibold mb-6">🗑️ Trash</h2>

      {/* Folders */}
      {folders.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-3">Folders</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {folders.map((f) => (
              <div
                key={f._id}
                className="p-4 shadow bg-white rounded-xl flex gap-4 items-center"
              >
                <FaFolder size={20} className="text-amber-300" /> {f.name}
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
              <FileCard key={f._id} file={f} onPreview={() => {}} />
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

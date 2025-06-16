import { useEffect, useState, useRef } from "react";
import axios from "axios";
import FileCard from "./components/FileCard";
import Masonry from "react-masonry-css";
import { FaCloudUploadAlt } from "react-icons/fa"; // updated icon

interface FileType {
  _id: string;
  filename: string;
  url: string;
  type: string;
  extractedText: string;
}

const App = () => {
  const [files, setFiles] = useState<FileType[]>([]);
  const [query, setQuery] = useState("");
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    const res = await axios.get("http://localhost:5000/files");
    setFiles(res.data);
  };

  const handleSearch = async () => {
    if (query.trim()) {
      const res = await axios.get(`http://localhost:5000/smart-search?q=${query}`);
      setFiles(res.data);
    } else {
      fetchFiles();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadQueue((prev) => [...prev, file]);

    const formData = new FormData();
    formData.append("file", file);

    await axios.post("http://localhost:5000/upload", formData);
    fetchFiles();
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 2
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-white shadow p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold">File Finder</h1>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files..."
            className="border border-gray-300 rounded-lg p-2 w-72"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Search
          </button>
          <button
            onClick={handleUploadClick}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaCloudUploadAlt size={18} /> Upload
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            hidden
          />
        </div>
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="bg-white p-4 shadow mb-4">
          <h2 className="font-medium mb-2">Uploading:</h2>
          <ul className="list-disc list-inside text-sm">
            {uploadQueue.map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* File List */}
      <div className="p-4">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {files.map((file) => (
            <FileCard key={file._id} file={file} />
          ))}
        </Masonry>
      </div>
    </div>
  );
};

export default App;

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import FileCard from "./components/FileCard";
import Masonry from "react-masonry-css";
import { FaCloudUploadAlt } from "react-icons/fa";
import FilePreviewModal from "./components/FilePreviewModal";

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
  const [suggestions, setSuggestions] = useState<FileType[]>([]);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    const res = await axios.get("http://localhost:5000/files");
    setFiles(res.data);
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      fetchFiles();
      return;
    }
    setLoading(true);
    const res = await axios.get(`http://localhost:5000/smart-search?q=${query}`);
    setFiles(res.data);
    setLoading(false);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setSuggestions([]);
      fetchFiles();
      return;
    }

    const res = await axios.get("http://localhost:5000/files");
    const filtered = res.data.filter((file: FileType) =>
      file.filename.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
      setSuggestions([]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadQueue((prev) => [...prev, ...files]);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post("http://localhost:5000/upload", formData);
    }

    fetchFiles();
    setUploadQueue([]);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 2,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-white shadow p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold">File Finder</h1>
        <div className="relative w-[500px]">
          <input
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search files..."
            className="border border-gray-300 rounded-3xl px-4 py-3 w-full"
          />
          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white border rounded-b-lg z-20 mt-1 max-h-60 overflow-y-auto">
              {suggestions.map((file) => (
                <li
                  key={file._id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setQuery(file.filename);
                    setSuggestions([]);
                    setFiles([file]);
                  }}
                >
                  {file.filename}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-2">
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
            multiple
            hidden
          />
        </div>
      </div>

      {/* Upload Queue Modal */}
      {uploadQueue.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white shadow-xl p-4 rounded-lg w-80">
          <div className="font-semibold mb-2">Uploading {uploadQueue.length} item(s)</div>
          {uploadQueue.map((file, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm border-b py-1">
              <span className="truncate w-48">{file.name}</span>
              <span className="text-blue-500 text-xs">Uploading...</span>
            </div>
          ))}
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div>
        </div>
      )}

      {/* File List */}
      {!loading && (
        <div className="p-4">
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {files.map((file) => (
              <FileCard key={file._id} file={file} onPreview={() => setPreviewFile(file)} />
            ))}
          </Masonry>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
};

export default App;

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FolderView from "../components/FolderView";
import axios from "../utils/axios";
import FileCard from "../components/FileCard";
import Masonry from "react-masonry-css";
import FilePreviewModal from "../components/FilePreviewModal";
import useAuthContext from "../context/userContext";

interface FileType {
  _id: string;
  filename: string;
  url: string;
  type: string;
  geminiText: string;
}

function Dashboard() {
  const { folderId } = useParams(); // get folderId from URL
  const [parentId, setParentId] = useState<string | null>(folderId || null);

  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<FileType[]>([]);
  const [suggestions, setSuggestions] = useState<FileType[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { previewFile, setPreviewFile, uploadQueue } = useAuthContext();

  useEffect(() => {
    setParentId(folderId || null); // when URL changes, update parentId
  }, [folderId]);

  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1,
  };

  return (
    <div className="min-h-screen bg-gray-100 rounded-tl-3xl">
      <main className="p-4">
        {/* Show smart search results ONLY if files > 0 */}
        {files.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-4">
              Search Results ({files.length})
            </h2>
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {files.map((file) => (
                <FileCard
                  key={file._id}
                  file={file}
                  onPreview={() => setPreviewFile(file)}
                />
              ))}
            </Masonry>
          </>
        )}

        {/* No results message */}
        {query.trim() && files.length === 0 && (
          <div className="text-center text-gray-600 mt-12">
            No matching images found.
          </div>
        )}

        {/* Folder view always visible */}
        <FolderView parentId={parentId} setParentId={setParentId} />
      </main>

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white shadow-xl p-4 rounded-lg w-80">
          <div className="font-semibold mb-2">
            Uploading {uploadQueue.length} item(s)
          </div>
          {uploadQueue.map((file, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center text-sm border-b py-1"
            >
              <span className="truncate w-48">{file.name}</span>
              <span className="text-blue-500 text-xs">Uploading...</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default Dashboard;

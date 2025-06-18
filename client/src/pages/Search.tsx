import { useEffect, useState } from "react";
import axios from "../utils/axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import FileCard from "../components/FileCard";
import Masonry from "react-masonry-css";
import FilePreviewModal from "../components/FilePreviewModal";
import useAuthContext from "../context/userContext";
import { RxCross2 } from "react-icons/rx";

interface FileType {
  _id: string;
  filename: string;
  url: string;
  type: string;
  geminiText: string;
}

function SearchPage() {
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryParams] = useSearchParams();
  const query = queryParams.get("q") || "";
  const { previewFile, setPreviewFile } = useAuthContext();
  const navigate = useNavigate();

  const fetchSmartSearch = async () => {
    if (!query.trim()) {
      setFiles([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`/smart-search?q=${encodeURIComponent(query)}`);
      setFiles(res.data);
    } catch (err) {
      console.error("Error in smart search:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartSearch();
  }, [query]);

  const handleClearSearch = () => {
    navigate("/");
  };

  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
            <h1 className="text-2xl">Search Results </h1>

      <main>
        {loading && (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div>
          </div>
        )}

        {!loading && files.length > 0 && (
          <>
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

        {!loading && files.length === 0 && (
          <div className="text-center text-gray-600 mt-12">
            No matching images found.
          </div>
        )}
      </main>

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

export default SearchPage;

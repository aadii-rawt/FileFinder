import { useState, useRef } from "react";
import FolderView from "./components/FolderView";
import axios from "./utils/axios";
import FileCard from "./components/FileCard";
import Masonry from "react-masonry-css";
import FilePreviewModal from "./components/FilePreviewModal";
import useAuthContext from "./context/userContext";
import { RxCross2 } from "react-icons/rx";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./Layout/Layout";
import Search from "./pages/Search";
import Trash from "./pages/Trash";
import Recent from "./pages/Recent";

interface FileType {
  _id: string;
  filename: string;
  url: string;
  type: string;
  geminiText: string;
}

function App() {
  const [parentId, setParentId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<FileType[]>([]);
  const [suggestions, setSuggestions] = useState<FileType[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { previewFile, setPreviewFile } = useAuthContext();

  // 👉 Suggestion on typing
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setSuggestions([]);
      return;
    }

    try {
      const res = await axios.get(`/files/all`);
      const filtered = res.data.filter((file: FileType) =>
        file.filename.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // 👉 Smart search when press Enter
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!query.trim()) {
        setFiles([]);
        return;
      }

      try {
        const res = await axios.get(`/files/all`);
        const matched = res.data.filter((file: FileType) =>
          file.geminiText.toLowerCase().includes(query.toLowerCase())
        );
        setFiles(matched);
        setSuggestions([]); // close suggestions
      } catch (err) {
        console.error("Error in smart search:", err);
      }
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setFiles([]);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1,
  };

  const router = createBrowserRouter([
    {
      path: "",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <Dashboard />
        },
        {
          path : "/folder/:folderId",
          element: <Dashboard />
        },
        {
          path: "/search",
          element: <Search />
        },
        {
          path: "/recent",
          element: <Recent />
        },
        {
          path: "/trash",
          element: <Trash />
        }
      ]
    }
  ])

  return (
    // <div className="min-h-screen bg-gray-50">
    //   {/* <header className="bg-white shadow p-4 flex items-center justify-between sticky top-0 z-10">
    //     <h1 className="text-xl font-semibold">🗂️ My Drive</h1>
    //     <div className="relative w-[500px]">
    //       <div
    //         className={`flex items-center justify-between gap-3 px-4 py-2 border border-gray-300 ${
    //           suggestions.length > 0 ? "rounded-t-3xl" : "rounded-3xl"
    //         }`}
    //       >
    //         <input
    //           ref={inputRef}
    //           type="text"
    //           value={query}
    //           onChange={handleInputChange}
    //           onKeyDown={handleKeyDown}
    //           placeholder="🔍 Search files..."
    //           className={` outline-none w-full`}
    //         />
    //         {query && (
    //           <button
    //             onClick={handleClearSearch}
    //             className="cursor-pointer underline ml-3"
    //           >
    //             <RxCross2 />
    //           </button>
    //         )}
    //       </div>
    //       {suggestions.length > 0 && (
    //         <ul className="absolute top-full left-0 right-0 bg-white shadow rounded-b-lg z-20 mt-1 max-h-60 overflow-y-auto">
    //           {suggestions.map((file) => (
    //             <li
    //               key={file._id}
    //               className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
    //               onClick={() => {
    //                 setPreviewFile(file);
    //               }}
    //             >
    //               {file.filename}
    //             </li>
    //           ))}
    //         </ul>
    //       )}
    //     </div>
    //   </header> */}
    //   <Header />

    //   <main className="p-4">
    //     {/* Show smart search results ONLY if files > 0 */}
    //     {files.length > 0 && (
    //       <>
    //         <h2 className="text-lg font-semibold mb-4">
    //           Search Results ({files.length})
    //         </h2>
    //         <Masonry
    //           breakpointCols={breakpointColumnsObj}
    //           className="my-masonry-grid"
    //           columnClassName="my-masonry-grid_column"
    //         >
    //           {files.map((file) => (
    //             <FileCard
    //               key={file._id}
    //               file={file}
    //               onPreview={() => setPreviewFile(file)}
    //             />
    //           ))}
    //         </Masonry>
    //       </>
    //     )}

    //     {/* No results message */}
    //     {query.trim() && files.length === 0 && (
    //       <div className="text-center text-gray-600 mt-12">
    //         No matching images found.
    //       </div>
    //     )}

    //     {/* Folder view stays always */}
    //     <FolderView parentId={parentId} setParentId={setParentId} />
    //   </main>

    //   {previewFile && (
    //     <FilePreviewModal
    //       file={previewFile}
    //       onClose={() => setPreviewFile(null)}
    //     />
    //   )}
    // </div>
    // <Dashboard />
    <RouterProvider router={router} />

  );
}

export default App;

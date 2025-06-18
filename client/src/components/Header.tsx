import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../utils/axios";
import { RxCross2 } from "react-icons/rx";
import useAuthContext from "../context/userContext";
import { FaRegFileImage } from "react-icons/fa";
import { CiFileOn } from "react-icons/ci";

interface FileType {
    _id: string;
    filename: string;
    url: string;
    type: string;
    geminiText: string;
}

const fileTypeIcons: { [key: string]: string } = {
    "image": <FaRegFileImage />,
    "application/pdf": <CiFileOn />,
    "application/vnd.ms-excel": <FaRegFileImage />,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": <FaRegFileImage />, // for newer excel
    "default": <FaRegFileImage />
};

const Header: React.FC = () => {
    const { folderId } = useParams(); // 🚀 THIS is your current folder
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<FileType[]>([]);
    const [folderName, setFolderName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();
    const { setPreviewFile, setUploadQueue } = useAuthContext();

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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            if (query.trim()) {
                navigate(`/search?q=${encodeURIComponent(query)}`);
            }
            setQuery("");
        }
    };

    const handleClearSearch = () => {
        setQuery("");
        setSuggestions([]);
        inputRef.current?.focus();
    };

    const handleFolderCreate = async () => {
        if (!folderName.trim()) return;
        await axios.post("/folders", { name: folderName, parent: folderId || null });
        setFolderName("");
        window.location.reload();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Push to upload queue
        setUploadQueue((prev: File[]) => [...prev, file]);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("parent", folderId || "");

        try {
            await axios.post("/upload", formData);
            console.log("✅ File uploaded:", file.name);
        } catch (err) {
            console.error("Upload failed:", err);
        }

        // Remove from queue
        setUploadQueue((prev: File[]) => prev.filter((f) => f.name !== file.name));
    };


    const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Extract top folder name from first file path
        const firstFile = files[0];
        const fullPath = (firstFile as any).webkitRelativePath;
        const topFolderName = fullPath.split("/")[0];

        // 1️⃣ Create the folder first
        const folderRes = await axios.post("/folders", {
            name: topFolderName,
            parent: folderId || null, // current folderId
        });

        const newFolderId = folderRes.data._id;
        console.log("📂 Created folder:", topFolderName, "ID:", newFolderId);

        // 2️⃣ Upload each file to that folder
        for (const file of files) {
            // Add to queue
            setUploadQueue((prev: File[]) => [...prev, file]);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("parent", newFolderId);

            try {
                await axios.post("/upload", formData);
                console.log("✅ Uploaded file:", file.name);
            } catch (err) {
                console.error("Upload failed:", err);
            }

            // Remove from queue
            setUploadQueue((prev: File[]) => prev.filter((f) => f.name !== file.name));
        }
    };


    const getFileIcon = (type: string) => {
        if (type.startsWith("image")) return fileTypeIcons["image"];
        return fileTypeIcons[type] || fileTypeIcons["default"];
    };


    return (
        <header className="bg-white p-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
            {/* Search */}
            <div className="relative w-[500px]">
                <div
                    className={`flex items-center justify-between gap-3 px-4 py-2 border border-gray-300 ${suggestions.length > 0 ? "rounded-t-3xl" : "rounded-3xl"
                        }`}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="🔍 Search files..."
                        className="outline-none w-full"
                    />
                    {query && (
                        <button
                            onClick={handleClearSearch}
                            className="cursor-pointer underline ml-3"
                        >
                            <RxCross2 />
                        </button>
                    )}
                </div>
                {suggestions.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 bg-white shadow rounded-b-lg z-20 mt-1 max-h-60 overflow-y-auto">
                        {suggestions.map((file) => (
                            <li
                                key={file._id}
                                className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                    setPreviewFile(file);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <div>{getFileIcon(file.type)}</div>
                                    <span className="truncate">{file.filename}</span>
                                </div>

                                <div className="text-sm text-gray-500 ml-4 whitespace-nowrap">
                                    {new Date(file.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </li>

                        ))}
                    </ul>
                )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
                {/* Folder Name */}
                <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="New folder name"
                    className="border border-gray-300 px-3 py-2 rounded"
                />

                <button
                    onClick={handleFolderCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Create Folder
                </button>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                >
                    Upload File
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    onChange={handleFileUpload}
                />

                <button
                    onClick={() => folderInputRef.current?.click()}
                    className="bg-purple-600 text-white px-4 py-2 rounded"
                >
                    Upload Folder
                </button>

                <input
                    type="file"
                    ref={folderInputRef}
                    hidden
                    webkitdirectory="true"
                    multiple
                    onChange={handleFolderUpload}
                />

            </div>

        </header>
    );
};

export default Header;

import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../utils/axios";
import { RxCross2 } from "react-icons/rx";
import useAuthContext from "../context/userContext";
import { FaRegFileAlt, FaRegFileImage, FaRegImage } from "react-icons/fa";

interface FileType {
    _id: string;
    filename: string;
    url: string;
    type: string;
    geminiText: string;
}

const fileTypeIcons: { [key: string]: string } = {
    "image": <FaRegImage className="text-red-500" />,
    "application/pdf": <FaRegFileAlt  className="text-green-600"/>,
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
    const { setPreviewFile,} = useAuthContext();

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

    const getFileIcon = (type: string) => {
        if (type.startsWith("image")) return fileTypeIcons["image"];
        return fileTypeIcons[type] || fileTypeIcons["default"];
    };


    return (
        <header className="bg-white p-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
            {/* Search */}
            <div className="relative w-[500px]">
                <div
                    className={`flex items-center justify-between gap-3 px-4 py-2 border bg-gray-100 border-gray-300 ${suggestions.length > 0 ? "rounded-t-3xl" : "rounded-3xl"
                        }`}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder=" Ask AI to search for any file"
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
                    <ul className="absolute top-full left-0 right-0 bg-gray-100 shadow rounded-b-lg z-20 max-h-60 overflow-y-auto">
                        {suggestions.map((file) => (
                            <li
                                key={file._id}
                                className="flex items-center justify-between px-4 py-2 hover:bg-gray-200 cursor-pointer"
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
            <div>
                <img src="/avatar.png" alt="avatar image" className="w-11 h-11 rounded-full bg-green-500" />
            </div>
        </header>
    );
};

export default Header;

// src/context/UserContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface UserType {
    _id: string;
    username: string;
    email: string;
}

interface FileType {
    _id: string;
    filename: string;
    url: string;
    type: string;
    geminiText: string;
}

interface UserContextType {
    user: UserType | null;
    setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
    loading: boolean;
    previewFile: FileType | null;
    setPreviewFile: React.Dispatch<React.SetStateAction<FileType | null>>;
    uploadQueue: File[];
    setUploadQueue: React.Dispatch<React.SetStateAction<File[]>>;
}


const UserContext = createContext<UserContextType | undefined>(undefined);

const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true); // NEW
    const [previewFile, setPreviewFile] = useState<FileType | null>(null);
    const [uploadQueue, setUploadQueue] = useState<File[]>([]);
    useEffect(() => {
        const fetchUser = async () => {
            const token = await window.electron.ipcRenderer.invoke("get-token");
            console.log(token);
            
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get("http://localhost:5000/api/v1/auth/me", {
                     headers: {
                         Authorization: token,
                     },
                });

                setUser(res.data.user);
            } catch (error) {
                console.error("User fetch failed:", error);
                localStorage.removeItem("token");
            } finally {
                setLoading(false); // ✅ Make sure to mark loading complete
            }
        };

        fetchUser();
    }, []);


    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
                loading,
                previewFile,
                setPreviewFile,
                uploadQueue,
                setUploadQueue,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

const useAuthContext = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useAuthContext must be used inside a UserContextProvider");
    }
    return context;
};

export default useAuthContext;
export { UserContextProvider };

import { createContext, useContext, useEffect, useState } from "react";
const UserContext = createContext();

interface FileType {
    _id: string;
    filename: string;
    url: string;
    type: string;
    geminiText: string;
}

const UserContextProvider = ({ children }) => {
    const [previewFile, setPreviewFile] = useState<FileType | null>(null);
    const [uploadQueue, setUploadQueue] = useState<File[]>([]);
    const [user, setUser] = useState([{}])

    return (
        <UserContext.Provider
            value={{
                user, setUser,
                previewFile,
                setPreviewFile,
                uploadQueue,
                setUploadQueue
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

const useAuthContext = () => useContext(UserContext);
export default useAuthContext;
export { UserContextProvider };

import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import FolderView from "../components/FolderView";
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
  const { folderId } = useParams();
  const [parentId, setParentId] = useState<string | null>(folderId || null);
  const [query, setQuery] = useState("");
  const { previewFile, setPreviewFile, uploadQueue ,user} = useAuthContext();

  const [syncFolderSet, setSyncFolderSet] = useState<boolean | null>(null);

  useEffect(() => {
    setParentId(folderId || null);
  }, [folderId]);

  // Check if sync folder is already set on first load
  useEffect(() => {
    (async () => {
      const folder = await (window as any).electron.ipcRenderer.invoke("get-selected-folder");
      setSyncFolderSet(!!folder);

      if (!folder) {
        const selected = await (window as any).electron.ipcRenderer.invoke("select-folder");
        if (!selected) {
          alert("⚠️ Auto-upload folder not selected. You can set it later.");
        } else {
          alert("✅ Auto-upload folder selected: " + selected);
        }
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 rounded-tl-3xl">
      <main className="p-4">
        {query.trim() && <div className="text-center text-gray-600 mt-12">No matching images found.</div>}
        <FolderView parentId={parentId} setParentId={setParentId} />
      </main>

      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

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
    </div>
  );
}

export default Dashboard;

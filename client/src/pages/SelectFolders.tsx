import { useEffect, useState } from "react";
import { IoFolderOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

interface FolderItem {
  path: string;
  checked: boolean;
}

const SelectFolders = () => {
  const [suggestedFolder, setSuggestedFolder] = useState<FolderItem | null>(null);
  const [customFolders, setCustomFolders] = useState<FolderItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    window.electron.ipcRenderer.invoke("get-suggested-folder").then((paths: string[]) => {
      if (paths && paths.length > 0) {
        // You can pick one or handle all — here we pick the first one
        setSuggestedFolder({
          path: paths[0],
          checked: false, // ❌ Default to unchecked
        });
      }
    });
  }, []);

  const addFolder = async () => {
    const paths: string[] = await window.electron.ipcRenderer.invoke("select-folder");
    if (paths && paths.length > 0) {
      const newFolders: FolderItem[] = paths.map(p => ({ path: p, checked: true }));
      setCustomFolders(prev => {
        const existingPaths = new Set(prev.map(f => f.path));
        return [...prev, ...newFolders.filter(f => !existingPaths.has(f.path))];
      });
    }
  };

  const toggleCheckbox = (path: string, isSuggested = false) => {
    if (isSuggested && suggestedFolder) {
      setSuggestedFolder({ ...suggestedFolder, checked: !suggestedFolder.checked });
    } else {
      setCustomFolders(prev =>
        prev.map(folder =>
          folder.path === path ? { ...folder, checked: !folder.checked } : folder
        )
      );
    }
  };

  const confirmSync = async () => {
    const userId = await window.electron.ipcRenderer.invoke("get-user-id");

    const selected = [
      ...(suggestedFolder?.checked ? [suggestedFolder.path] : []),
      ...customFolders.filter(f => f.checked).map(f => f.path),
    ];

    await window.electron.ipcRenderer.invoke("set-sync-folders", selected, userId);
    navigate("/");
  };

  const getLastFolderName = (fullPath: string): string => {
    if (!fullPath) return "";
    const parts = fullPath.split(/[/\\]/).filter(Boolean);
    return parts[parts.length - 1] || "";
  };

  return (
    <div className="p-6 w-full max-w-xl mx-auto min-h-screen flex items-center justify-center">
      <div className="">
        <h2 className="text-4xl font-semibold my-2">Welcome To DotDrive</h2>
        <p>Safely store your files in DotDrive and access them anytime from your computer</p>

        <div className="mt-5">
          <h1 className="text-gray-600 mb-4">Select folders to sync from computer to DotDrive</h1>

          {suggestedFolder && (
            <label className="flex items-center gap-8 p-2 rounded">
              <input
                type="checkbox"
                checked={suggestedFolder.checked}
                onChange={() => toggleCheckbox(suggestedFolder.path, true)}
              />
              <div className="flex gap-3 items-start">
                <IoFolderOutline size={20} />
                <div>
                  <h1 className="font-medium">
                    {getLastFolderName(suggestedFolder.path)}{" "}
                    <span className="ml-3 rounded-xl px-3 py-0.5 text-sm bg-blue-600 text-white font-normal">
                      Suggested folder
                    </span>
                  </h1>
                  <span className="text-sm text-gray-500">{suggestedFolder.path}</span>
                </div>
              </div>
            </label>
          )}
        </div>

        <div className="mb-4">
          {customFolders.map((folder, index) => (
            <label
              key={index}
              className="flex gap-8 p-2 bg-white rounded mb-2"
            >
              <input
                type="checkbox"
                checked={folder.checked}
                onChange={() => toggleCheckbox(folder.path)}
              />
              <div className="flex gap-3 items-start">
                <IoFolderOutline size={20} />
                <div>
                  <h1 className="font-medium">{getLastFolderName(folder.path)}</h1>
                  <span className="text-sm text-gray-500">{folder.path}</span>
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-between gap-3 mt-10">
          <button
            onClick={addFolder}
            className="px-4 py-2 font-semibold cursor-pointer text-blue-500 rounded hover:bg-blue-100"
          >
            Add Folder
          </button>
          <button
            onClick={confirmSync}
            className="px-4 py-2 bg-blue-600 cursor-pointer text-white rounded hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectFolders;

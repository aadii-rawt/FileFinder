// src/pages/Onboarding.tsx
import { useState } from "react";

const Onboarding = () => {
  const [folderPath, setFolderPath] = useState("");

  const selectFolder = async () => {
    try {
      const folder = await (window as any).electron.ipcRenderer.invoke('select-folder');
      if (folder) {
        setFolderPath(folder);
        alert("📂 Auto-upload folder selected: " + folder);
        // Optionally navigate to home/dashboard
      } else {
        alert("❌ No folder selected.");
      }
    } catch (err) {
      console.error("Error selecting folder:", err);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white text-black">
      <h1 className="text-3xl font-bold mb-4">Welcome to DotDrive 🚀</h1>
      <p className="mb-6 text-gray-600">Choose a folder to sync automatically with DotDrive.</p>
      <button
        onClick={selectFolder}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Select Auto-Upload Folder
      </button>

      {folderPath && (
        <p className="mt-4 text-green-600">
          Selected: <span className="font-mono">{folderPath}</span>
        </p>
      )}
    </div>
  );
};

export default Onboarding;

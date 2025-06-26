import { useState, useEffect } from "react";

interface Props {
  originalName: string;
  existingNames: string[];
  onSave: (newName: string) => void;
  onClose: () => void;
}

const RenameModal = ({ originalName, existingNames, onSave, onClose }: Props) => {
  const [name, setName] = useState(originalName);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingNames.includes(name.trim()) && name.trim() !== originalName) {
      setError("Name already exists");
    } else {
      setError("");
    }
  }, [name, existingNames, originalName]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 bg-opacity-30 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Rename</h2>
        <input
          className="w-full border px-3 py-2 rounded mb-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded cursor-pointer">
            Cancel
          </button>
          <button
            disabled={!!error || name.trim() === originalName.trim()}
            onClick={() => onSave(name.trim())}
            className={`px-4 py-2 rounded cursor-pointer ${error || name.trim() === originalName.trim() ? "bg-gray-300" : "bg-blue-600 text-white"}`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;

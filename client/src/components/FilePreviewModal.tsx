import React from "react";
import { FaTimes, FaDownload, FaPrint } from "react-icons/fa";
import { IoPrintOutline } from "react-icons/io5";
import { LuDownload } from "react-icons/lu";
import { RxCross2 } from "react-icons/rx";

interface FileType {
  _id: string;
  filename: string;
  url: string;
  type: string;
  extractedText: string;
}

interface Props {
  file: FileType;
  onClose: () => void;
}

const FilePreviewModal: React.FC<Props> = ({ file, onClose }) => {
  
  const handleDownload = async () => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.filename;
      link.click();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handlePrint = async () => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`
        <html>
          <head>
            <title>Print Preview</title>
            <style>
              body, html {
                margin: 0;
                padding: 0;
                text-align: center;
              }
              img {
                max-width: 100%;
                max-height: 100vh;
              }
            </style>
          </head>
          <body>
            <img src="${blobUrl}" onload="window.print(); window.onafterprint = () => window.close();" />
          </body>
        </html>
      `);
        win.document.close();
      }
    } catch (err) {
      console.error("Print failed:", err);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/80 text-white z-50 flex justify-center items-center">
      <div className="relative w-full h-full bg-transparent  shadow-xl rounded overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 w-full bg-black/30 flex items-center justify-between px-10 py-5 z-10">
          <div className="flex items-center gap-5 ">
            <button onClick={onClose} title="Close" className="cursor-pointer">
              <RxCross2 size={25} />
            </button>
            <span className="text-xl truncate">{file.filename}</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={handleDownload} title="Download" className="cursor-pointer">
              <LuDownload size={25} />
            </button>
            <button onClick={handlePrint} title="Print" className="cursor-pointer">
              <IoPrintOutline size={25} />
            </button>

          </div>
        </div>

        {/* Content Preview */}
        <div className="h-full w-full pt-12 flex justify-center items-center bg-transparent">
          {file.type.includes("pdf") ? (
            <iframe
              src={file.url}
              className="w-[80%] h-[90%] rounded shadow"
              title="PDF Preview"
            />
          ) : (
            <img
              src={file.url}
              alt={file.filename}
              className="max-w-[90%] min-w-[50%] max-h-[90%] rounded shadow"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;

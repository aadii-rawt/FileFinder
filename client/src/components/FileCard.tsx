import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { useState } from "react";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface FileType {
  _id: string;
  filename: string;
  url: string;
  type: string;
  extractedText: string;
}

const FileCard = ({ file, onPreview }: { file: FileType; onPreview: () => void }) => {
  const [numPages, setNumPages] = useState<number | null>(null);

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div
      className="bg-white shadow p-4 rounded-lg my-4 cursor-pointer"
      onClick={onPreview}
    >
      <h2 className="font-semibold mb-2 truncate">{file.filename}</h2>

      {file.type.startsWith("image") ? (
        <img
          src={file.url}
          alt={file.filename}
          className="w-full h-auto rounded"
        />
      ) : file.type === "application/pdf" ? (
        <div className="w-full overflow-hidden rounded border">
          <Document
            file={file.url}
            onLoadSuccess={handleLoadSuccess}
            loading={<div className="text-sm text-gray-400">Loading PDF...</div>}
          >
            <Page
              pageNumber={1}
              width={250}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Unsupported file</p>
      )}
    </div>
  );
};

export default FileCard;

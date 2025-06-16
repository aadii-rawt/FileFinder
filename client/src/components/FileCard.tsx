
interface FileType {
  _id: string;
  filename: string;
  url: string;
  type: string;
  extractedText: string;
}
const FileCard = ({ file }: { file: FileType }) => {
  return (
    <div className="bg-white shadow p-4 rounded my-4">
      <h2 className="font-semibold mb-2">{file.filename}</h2>
      {file.type.startsWith("image") ? (
        <img src={file.url} alt={file.filename} className="w-full mb-2" />
      ) : (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          View PDF
        </a>
      )}
      {/* <p className="text-sm text-gray-600 mt-2">{file.extractedText.slice(0, 100)}...</p> */}
    </div>
  );
};

export default FileCard;

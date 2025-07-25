import React, { useCallback, useState, useEffect } from "react"; // Added useState, useEffect
import { useDropzone } from "react-dropzone";
import { formatSize } from "~/lib/utils";

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
  // We'll still keep 'file' prop for initial value or external control,
  // but the component will manage its own `displayFile` state for removal.
  file?: File | null; // Made optional as `FileUploader` will manage its own display state.
}

const FileUploader = ({ onFileSelect, file: propFile }: FileUploaderProps) => {
  // Use local state to manage the file that is currently displayed.
  // This state will be cleared when the cross button is clicked.
  const [displayFile, setDisplayFile] = useState<File | null>(null);

  // useEffect to sync propFile with displayFile, especially on initial mount or external reset
  useEffect(() => {
    // Only update if propFile is explicitly null, or if it's a new file.
    // This prevents infinite loops if onFileSelect also updates propFile.
    const fileToSet = propFile === undefined ? null : propFile;
    if (fileToSet !== displayFile) {
      setDisplayFile(fileToSet);
    }
  }, [propFile]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const droppedFile = acceptedFiles[0] || null;
      setDisplayFile(droppedFile); // Update local state for display
      onFileSelect?.(droppedFile); // Notify parent component
    },
    [onFileSelect]
  );

  const maxFileSize = 20 * 1024 * 1024; // 20MB in bytes

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"] },
    maxSize: maxFileSize,
    // When a file is selected, we disable clicking on the dropzone itself,
    // but the getRootProps div might still be present around the selected file display.
    // Using `noClick: !!displayFile` ensures clicking the area doesn't re-open the dialog.
    noClick: !!displayFile, // Disable click if a file is being displayed
  });

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from bubbling up to getRootProps()
    e.preventDefault(); // Prevent any default form submission (important if inside a form)
    console.log("Cross button clicked, stopping propagation and default.");

    setDisplayFile(null); // <--- THIS IS THE KEY: Clear local state immediately
    onFileSelect?.(null); // Notify parent component that file is cleared
  };

  return (
    <div className="w-full gradient-border">
      {displayFile ? ( // <--- Use `displayFile` for rendering
        <div
          className="uploader-selected-file"
          // We still need a click handler on this div to prevent clicks
          // from propagating to a parent getRootProps if this div isn't
          // strictly outside it (though our conditional rendering handles it).
          // However, since getRootProps is conditionally rendered, this specific
          // stopPropagation might be redundant here if the structure is correct.
          // Keeping it for safety if you decide to restructure.
          onClick={(e) => e.stopPropagation()}
        >
          <img src="/images/pdf.png" alt="pdf" className="size-10" />
          <div className="flex items-center space-x-3">
            <div>
              <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                {displayFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatSize(displayFile.size)}
              </p>
            </div>
          </div>
          <button
            type="button" // Important for buttons inside forms
            className="p-2 cursor-pointer"
            onClick={handleRemoveFile}
          >
            <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // This is the droppable area when no file is selected.
        // getRootProps() is only applied here.
        <div {...getRootProps()} className="uplader-drag-area">
          <input {...getInputProps()} />
          <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
            <img src="/icons/info.svg" alt="upload" className="size-20" />
          </div>
          <p className="text-lg text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-lg text-gray-500">
            PDF ({formatSize(maxFileSize)})
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;

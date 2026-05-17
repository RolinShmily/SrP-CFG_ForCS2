import { useState, useCallback, useRef } from "react";
import { Upload, CheckCircle } from "lucide-react";

interface Props {
  onUploadComplete: () => void;
  disabled?: boolean;
}

export default function UploadZone({ onUploadComplete, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getPaths = (fileList: FileList): string[] => {
    const arr: File[] = [];
    for (let i = 0; i < fileList.length; i++) arr.push(fileList[i]);
    return window.api.getFilePaths(arr);
  };

  const handleFiles = useCallback(
    async (filePaths: string[]) => {
      if (filePaths.length === 0 || uploading) return;
      setUploading(true);
      setUploadSuccess(false);
      try {
        const entry = await window.api.uploadFiles(filePaths);
        if (entry) {
          setUploadSuccess(true);
          onUploadComplete();
        }
      } finally {
        setUploading(false);
      }
    },
    [uploading, onUploadComplete],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      handleFiles(getPaths(e.dataTransfer.files));
    },
    [disabled, handleFiles],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    handleFiles(getPaths(files));
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          relative flex flex-col items-center justify-center gap-3 p-8
          border-2 border-dashed rounded-[var(--radius)] transition-all duration-200 cursor-pointer
          ${disabled
            ? "border-border bg-bg-card/50 opacity-50 cursor-not-allowed"
            : isDragging
              ? "border-accent bg-accent-bg scale-[1.01]"
              : "border-border-highlight bg-bg-card hover:border-accent/50 hover:bg-bg-hover"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".zip,.cfg,.txt"
          className="hidden"
          onChange={handleInputChange}
        />

        {uploading ? (
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        ) : (
          <Upload size={32} className={isDragging ? "text-accent" : "text-text-muted"} />
        )}

        <div className="text-center">
          <p className="text-sm text-text-secondary">
            {uploading ? "正在处理..." : "拖拽文件到此处或点击选择"}
          </p>
          <p className="text-xs text-text-faint mt-1">
            支持 .zip、.cfg、.txt 文件及文件夹
          </p>
        </div>
      </div>

      {uploadSuccess && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green/5 border border-green/20 rounded-[var(--radius-sm)]">
          <CheckCircle size={14} className="text-green shrink-0" />
          <span className="text-xs text-green font-medium">上传成功</span>
        </div>
      )}
    </div>
  );
}

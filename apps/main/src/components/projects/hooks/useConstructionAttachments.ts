import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";

export type AttachmentKind = "image" | "video" | "document";

interface UseConstructionAttachmentsOptions {
  disabled?: boolean;
}

const getFileExt = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

const isDocumentFile = (file: File) => {
  const ext = getFileExt(file.name);
  return (
    file.type === "application/pdf" ||
    file.type === "application/msword" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "pdf" ||
    ext === "doc" ||
    ext === "docx"
  );
};

const isSupportedAttachment = (file: File) =>
  file.type.startsWith("image/") ||
  file.type.startsWith("video/") ||
  isDocumentFile(file);

const getFileAttachmentKind = (file: File): AttachmentKind => {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  return "document";
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const useConstructionAttachments = ({
  disabled = false,
}: UseConstructionAttachmentsOptions = {}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDropActive, setIsDropActive] = useState(false);
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = (value: File[] | FileList | null) => {
    if (!value || value.length === 0) return;
    const selected = Array.from(value).filter(isSupportedAttachment);
    if (selected.length === 0) return;
    setFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const reorderFiles = (from: number, to: number) => {
    if (from === to) return;
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      if (!moved) return prev;
      next.splice(to, 0, moved);
      return next;
    });
  };

  const onSelectFiles = (value: FileList | null) => {
    addFiles(value);
  };

  const onDropFiles = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropActive(false);
    if (disabled) return;
    addFiles(e.dataTransfer.files);
  };

  const onDropzoneDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDropActive(true);
  };

  const onDropzoneDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDropActive(true);
  };

  const onDropzoneDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    const related = e.relatedTarget as Node | null;
    if (!related || !target.contains(related)) {
      setIsDropActive(false);
    }
  };

  const onItemDragStart = (idx: number) => setDraggedFileIndex(idx);
  const onItemDragEnd = () => setDraggedFileIndex(null);

  const onItemDragOver = (e: DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    if (draggedFileIndex === null || draggedFileIndex === idx) return;
    reorderFiles(draggedFileIndex, idx);
    setDraggedFileIndex(idx);
  };

  const selectedFilePreviews = useMemo(
    () =>
      files.map((file) => {
        const kind = getFileAttachmentKind(file);
        return {
          kind,
          previewUrl: kind === "document" ? null : URL.createObjectURL(file),
        };
      }),
    [files],
  );

  useEffect(() => {
    return () => {
      selectedFilePreviews.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [selectedFilePreviews]);

  return {
    files,
    isDropActive,
    draggedFileIndex,
    fileInputRef,
    selectedFilePreviews,
    addFiles,
    clearFiles,
    removeFile,
    onSelectFiles,
    onDropFiles,
    onDropzoneDragOver,
    onDropzoneDragEnter,
    onDropzoneDragLeave,
    onItemDragStart,
    onItemDragEnd,
    onItemDragOver,
    getFileAttachmentKind,
    formatFileSize,
  };
};

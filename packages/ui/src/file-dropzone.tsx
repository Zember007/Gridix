import * as React from "react";
import { Upload } from "lucide-react";

import { cn } from "@gridix/utils/lib";

const gridBackgroundStyle: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px)
  `,
  backgroundPosition: "center",
  backgroundSize: "40px 40px",
};

const formatFileSize = (bytes: number): string => {
  if (bytes <= 0) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export interface FileDropzoneProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "onDrop"
> {
  onFilesSelected?: (files: File[]) => void | Promise<void>;
  resolveDroppedFiles?: (
    dataTransfer: DataTransfer,
  ) => File[] | null | undefined | Promise<File[] | null | undefined>;
  accept?: string;
  disabled?: boolean;
  multiple?: boolean;
  heading?: React.ReactNode;
  description?: React.ReactNode;
  idleLabel?: React.ReactNode;
  dropLabel?: React.ReactNode;
  selectedFiles?: File[];
}

export const FileDropzone = React.forwardRef<HTMLDivElement, FileDropzoneProps>(
  (
    {
      className,
      onFilesSelected,
      resolveDroppedFiles,
      accept,
      disabled = false,
      multiple = false,
      heading = "Upload file",
      description = "Drag or drop your files here or click to upload",
      idleLabel,
      dropLabel = "Drop it",
      selectedFiles = [],
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isDragActive, setIsDragActive] = React.useState(false);

    const handleFiles = React.useCallback(
      async (fileList: FileList | File[] | null) => {
        if (!fileList || disabled) return;

        const files = Array.from(fileList);
        if (files.length === 0) return;

        await onFilesSelected?.(multiple ? files : files.slice(0, 1));
      },
      [disabled, multiple, onFilesSelected],
    );

    const handleClick = React.useCallback(() => {
      if (disabled) return;
      inputRef.current?.click();
    }, [disabled]);

    const handleDragOver = React.useCallback(
      (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (disabled) return;
        setIsDragActive(true);
      },
      [disabled],
    );

    const handleDragLeave = React.useCallback(
      (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (disabled) return;

        const nextTarget = event.relatedTarget as Node | null;
        if (nextTarget && event.currentTarget.contains(nextTarget)) {
          return;
        }

        setIsDragActive(false);
      },
      [disabled],
    );

    const handleDrop = React.useCallback(
      async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (disabled) return;

        setIsDragActive(false);
        const resolvedFiles = resolveDroppedFiles
          ? await resolveDroppedFiles(event.dataTransfer)
          : event.dataTransfer.files;
        await handleFiles(resolvedFiles ?? null);
      },
      [disabled, handleFiles, resolveDroppedFiles],
    );

    return (
      <div
        ref={ref}
        className={cn("w-full overflow-hidden rounded-xl", className)}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...props}
      >
        <div
          onClick={handleClick}
          className={cn(
            "group/file relative block w-full cursor-pointer overflow-hidden rounded-[inherit] border border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-white transition-all duration-200 ease-out",
            !disabled &&
              "hover:-translate-y-0.5 hover:shadow-[0px_24px_50px_rgba(15,23,42,0.10)]",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={async (event) => {
              await handleFiles(event.target.files);
              event.currentTarget.value = "";
            }}
            className="hidden"
            disabled={disabled}
          />

          <div
            className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-50"
            style={gridBackgroundStyle}
          />

          <div className="relative flex min-h-[220px] flex-col items-center justify-center px-6 py-8 md:min-h-[260px] md:px-10">
            <div className="max-w-md space-y-2 text-center">
              <p className="z-20 text-base font-semibold text-slate-800">
                {heading}
              </p>
              <p className="z-20 text-sm leading-6 text-slate-500 md:text-base">
                {description}
              </p>
            </div>

            <div className="relative w-full max-w-xl">
              {selectedFiles.length > 0 &&
                selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className={cn(
                      "relative z-40 mx-auto mt-4 flex w-full flex-col items-start justify-start overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
                      "md:h-24",
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-4">
                      <p className="max-w-xs truncate text-base text-neutral-700">
                        {file.name}
                      </p>
                      <p className="w-fit shrink-0 rounded-lg px-2 py-1 text-sm text-neutral-600 shadow-sm">
                        {formatFileSize(file.size)}
                      </p>
                    </div>

                    <div className="mt-2 flex w-full flex-col items-start justify-between text-sm text-neutral-600 md:flex-row md:items-center">
                      <p className="rounded-md bg-gray-100 px-1 py-0.5">
                        {file.type || "Unknown type"}
                      </p>

                      <p>
                        modified{" "}
                        {new Date(file.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}

              {selectedFiles.length === 0 && (
                <>
                  <div
                    className={cn(
                      "relative z-40 mx-auto mt-3 flex h-24 w-full max-w-[11rem] flex-col items-center justify-center rounded-2xl border bg-white/95 shadow-[0px_18px_40px_rgba(15,23,42,0.10)] transition-all duration-200 ease-out",
                      isDragActive
                        ? "border-sky-300 text-sky-600 shadow-[0px_24px_50px_rgba(14,165,233,0.14)]"
                        : "border-slate-200 text-slate-500",
                      !disabled && "group-hover/file:-translate-y-0.5",
                    )}
                  >
                    <Upload
                      className={cn(
                        "h-5 w-5",
                        isDragActive ? "text-sky-600" : "text-slate-500",
                      )}
                    />
                    <span className="mt-2 text-xs font-medium tracking-[0.14em] uppercase">
                      {isDragActive
                        ? dropLabel
                        : (idleLabel ?? "Click or Drop")}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 z-30 mx-auto mt-3 flex h-24 w-full max-w-[11rem] items-center justify-center rounded-2xl border transition-opacity duration-200",
                      isDragActive
                        ? "border-dashed border-sky-400/80 bg-sky-50/20 opacity-100"
                        : "border-dashed border-sky-400/60 bg-transparent opacity-0",
                    )}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

FileDropzone.displayName = "FileDropzone";

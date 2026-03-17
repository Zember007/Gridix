import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";

export type PendingVideoUpload = {
  id: string;
  file: File;
  filePreviewUrl: string;
  title: string;
  thumbnailFile: File | null;
  thumbnailPreviewUrl: string | null;
};

interface VideoUploadDialogProps {
  open: boolean;
  uploading: boolean;
  items: PendingVideoUpload[];
  onOpenChange: (open: boolean) => void;
  onTitleChange: (id: string, title: string) => void;
  onThumbnailChange: (id: string, file: File | null) => void;
  onSubmit: () => void;
}

export const VideoUploadDialog = ({
  open,
  uploading,
  items,
  onOpenChange,
  onTitleChange,
  onThumbnailChange,
  onSubmit,
}: VideoUploadDialogProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("projectList.media.videoUploadDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("projectList.media.videoUploadDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
                  {item.thumbnailPreviewUrl ? (
                    <img
                      src={item.thumbnailPreviewUrl}
                      alt={item.title}
                      className="aspect-video h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.filePreviewUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="aspect-video h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs font-semibold text-slate-500">
                      {t("projectList.media.videoUploadDialog.fileLabel")}
                    </div>
                    <div className="truncate text-sm font-medium text-slate-900">
                      {item.file.name}
                    </div>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-slate-500">
                      {t("projectList.media.videoUploadDialog.videoTitleLabel")}
                    </span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => onTitleChange(item.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </label>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500">
                      {t("projectList.media.videoUploadDialog.thumbnailLabel")}
                    </div>
                    <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                      {t("projectList.media.videoUploadDialog.uploadThumbnail")}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          onThumbnailChange(
                            item.id,
                            e.target.files?.[0] ?? null,
                          )
                        }
                      />
                    </label>
                    {item.thumbnailFile && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="truncate">
                          {item.thumbnailFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => onThumbnailChange(item.id, null)}
                          className="rounded px-2 py-1 text-slate-600 transition hover:bg-slate-200"
                        >
                          {t(
                            "projectList.media.videoUploadDialog.removeThumbnail",
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            {t("projectList.media.videoUploadDialog.cancel")}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={uploading || items.length === 0}
          >
            {uploading
              ? t("projectList.media.uploading")
              : t("projectList.media.videoUploadDialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import React from "react";
import { X } from "lucide-react";
import { PayoutRequests } from "./PayoutRequests";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawalRequestsModal: React.FC<Props> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-end border-b border-gray-100 p-4">
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <PayoutRequests />
        </div>
      </div>
    </div>
  );
};

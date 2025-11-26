import React from 'react';
import { X } from 'lucide-react';
import { PayoutRequests } from './PayoutRequests';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden h-[80vh] flex flex-col">
        <div className="flex items-center justify-end p-4 border-b border-gray-100">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
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




import React from 'react';

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 h-full">
    <div className="flex items-center gap-3 mb-4">
      <span className="flex-shrink-0 bg-gray-100 p-2 rounded-md">{icon}</span>
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
    </div>
    <div className="text-gray-600 space-y-2">{children}</div>
  </div>
);

export default InfoCard;


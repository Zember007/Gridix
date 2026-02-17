import React from "react";

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, children }) => (
  <div className="h-full rounded-xl border border-gray-200 bg-white p-6">
    <div className="mb-4 flex items-center gap-3">
      <span className="flex-shrink-0 rounded-md bg-gray-100 p-2">{icon}</span>
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
    </div>
    <div className="space-y-2 text-gray-600">{children}</div>
  </div>
);

export default InfoCard;

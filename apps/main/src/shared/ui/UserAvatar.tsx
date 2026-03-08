import React from "react";

const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const getAvatarColor = (name: string) => {
  if (!name) return "bg-slate-500";
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const UserAvatar: React.FC<{ name: string; className?: string }> = ({
  name,
  className = "w-8 h-8 text-xs",
}) => {
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);

  return (
    <div
      className={`${className} rounded-full ${colorClass} flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white`}
    >
      {initials}
    </div>
  );
};

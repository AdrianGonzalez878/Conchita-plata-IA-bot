"use client";

import { useEffect, useState } from "react";

interface BusinessAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  refreshKey?: number;
}

const SIZES = {
  sm: "w-10 h-10 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-24 h-24 text-3xl",
};

export function BusinessAvatar({ size = "sm", className = "", refreshKey = 0 }: BusinessAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    fetch("/api/admin/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile_picture_url) {
          const url = data.profile_picture_url;
          const separator = url.includes("?") ? "&" : "?";
          setPhotoUrl(`${url}${separator}t=${Date.now()}`);
        } else {
          setPhotoUrl(null);
        }
      })
      .catch(() => setPhotoUrl(null));
  }, [refreshKey]);

  const sizeClass = SIZES[size];

  return (
    <div
      className={`rounded-full overflow-hidden bg-teal-600 flex items-center justify-center shrink-0 ${sizeClass} ${className}`}
    >
      {photoUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt="Conchita Plata"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-white font-semibold">{size === "lg" ? "💎" : "CP"}</span>
      )}
    </div>
  );
}

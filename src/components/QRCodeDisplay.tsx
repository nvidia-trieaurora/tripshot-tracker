"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  url: string;
  title?: string;
}

export default function QRCodeDisplay({ url, title }: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: { dark: "#1f2937", light: "#ffffff" },
    }).then(setDataUrl);
  }, [url]);

  return (
    <div className="inline-flex flex-col items-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={title ?? "QR Code"}
          className="h-48 w-48 rounded-xl"
        />
      ) : (
        <div className="h-48 w-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      )}
      {title && (
        <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </p>
      )}
    </div>
  );
}

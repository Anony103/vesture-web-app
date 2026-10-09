"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
export function AvatarUpload({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant="ghost"
        aria-label="Upload profile photo"
        className="size-[109px] rounded-full p-0"
        onClick={() => input.current?.click()}
      >
        <img
          src={url || "/figma/avatar.svg"}
          alt="Profile photo"
          width={109}
          height={109}
          className={`size-[109px] object-cover ${url ? "rounded-full" : ""}`}
        />
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png"
        aria-label="Profile photo file"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (!selected) return;
          if (
            !["image/jpeg", "image/png"].includes(selected.type) ||
            selected.size > 5 * 1024 * 1024
          ) {
            setError("Choose a JPG or PNG smaller than 5 MB.");
            return;
          }
          setError("");
          onChange(selected);
        }}
      />
      {error && (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

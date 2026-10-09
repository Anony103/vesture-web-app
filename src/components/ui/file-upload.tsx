"use client";
import { useId, useRef, useState } from "react";
import { Button } from "./button";
import { AssetIcon } from "./asset-icon";
import { cn } from "@/lib/utils";
export function FileUpload({
  file,
  onChange,
  label = "Drag your file(s) to start uploading",
  accept = "image/jpeg,image/png,application/pdf",
  maxSizeMB = 5,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  function pick(selected?: File) {
    if (!selected) return;
    if (!accept.split(",").includes(selected.type)) {
      setError("Please choose a JPG, PNG, or PDF file.");
      return;
    }
    if (selected.size > maxSizeMB * 1024 * 1024) {
      setError(`Choose a file smaller than ${maxSizeMB} MB.`);
      return;
    }
    setError("");
    onChange(selected);
  }
  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          pick(event.dataTransfer.files[0]);
        }}
        className={cn(
          "flex min-h-[172px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#3e3e3e] px-4 py-5 text-center",
          dragging && "border-lilac bg-lilac/10",
        )}
      >
        <AssetIcon name="upload" className="size-[22px]" />
        <p className="max-w-full truncate text-xs" role="status">
          {file ? file.name : label}
        </p>
        {file ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(null);
              if (input.current) input.current.value = "";
            }}
          >
            Remove file
          </Button>
        ) : (
          <div className="flex w-full max-w-[245px] items-center gap-4 text-[10px]">
            <span className="h-px flex-1 bg-[#e7e7e7]" />
            OR
            <span className="h-px flex-1 bg-[#e7e7e7]" />
          </div>
        )}
        <Button
          variant="upload"
          size="sm"
          onClick={() => input.current?.click()}
          className="min-h-7 px-2 text-[10px]"
        >
          {file ? "Replace file" : "Browse files"}
        </Button>
        <input
          ref={input}
          id={id}
          type="file"
          aria-label="Upload identity document"
          accept={accept}
          onChange={(event) => pick(event.target.files?.[0])}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
      <p className="mt-2 text-[10px] text-muted">
        JPG, PNG or PDF. Maximum {maxSizeMB} MB.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

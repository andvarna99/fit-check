"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/button";

type PhotoPickerProps = {
  onPick: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  /** Show the "Take photo" camera button (single-item flow). */
  camera?: boolean;
  libraryLabel?: string;
};

/**
 * Camera and photo-library buttons backed by hidden file inputs. iOS opens the
 * camera for `capture`, and the photo library (multi-select when `multiple`) otherwise.
 */
export function PhotoPicker({ onPick, disabled, multiple, camera = true, libraryLabel = "From library" }: PhotoPickerProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  function handle(input: HTMLInputElement | null) {
    const files = input?.files ? Array.from(input.files) : [];
    if (input) input.value = ""; // allow picking the same photo again
    if (files.length) onPick(files);
  }

  return (
    <div className="flex flex-col gap-3">
      {camera ? (
        <>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => handle(e.currentTarget)}
          />
          <Button block icon="camera" disabled={disabled} onClick={() => cameraRef.current?.click()}>
            Take photo
          </Button>
        </>
      ) : null}
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => handle(e.currentTarget)}
      />
      <Button
        block
        variant={camera ? "secondary" : "primary"}
        icon="image"
        disabled={disabled}
        onClick={() => libraryRef.current?.click()}
      >
        {libraryLabel}
      </Button>
    </div>
  );
}

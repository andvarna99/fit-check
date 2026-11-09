/* eslint-disable @next/next/no-img-element -- local preview blobs */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

import { EMPTY_ITEM_VALUES, ItemForm } from "@/components/closet/item-form";
import { PhotoPicker } from "@/components/closet/photo-picker";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button, IconButton } from "@/components/ui/button";
import { Icon, Sparkle } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { BarHeader } from "@/components/ui/screen-header";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { WindowPanel } from "@/components/ui/window-panel";
import { preparePhoto, resizeImage, THUMB_MAX_PX, type PreparedPhoto } from "@/lib/images/prepare";
import { removeBackgroundOnDevice, trimCutout, type RemovalProgress } from "@/lib/images/remove-background";

import { createItem, type SaveItemResult } from "../actions";

type Version = { photo: PreparedPhoto; thumb: PreparedPhoto; url: string };
type Photos = { original: Version; cutout: Version | null; cutoutFailed: boolean };
type Saved = Extract<SaveItemResult, { ok: true }>;
type Step = "capture" | "removing" | "result" | "details" | "saved";

const TOTAL_STEPS = 3;

function StepCount({ n }: { n: number }) {
  return (
    <span className="type-pixel-sm text-ink-muted" aria-label={`Step ${n} of ${TOTAL_STEPS}`}>
      {n}/{TOTAL_STEPS}
    </span>
  );
}

function progressLabel(p: RemovalProgress | null): { text: string; percent?: number } {
  if (!p) return { text: "Snipping..." };
  if (p.phase === "download") return { text: "Fetching scissors...", percent: Math.round(p.fraction * 100) };
  return { text: "Snipping...", percent: Math.round(p.fraction * 100) };
}

export function AddItemFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("capture");
  const [photos, setPhotos] = useState<Photos | null>(null);
  const [keepOriginal, setKeepOriginal] = useState(false);
  const [compare, setCompare] = useState<"before" | "after">("after");
  const [progress, setProgress] = useState<RemovalProgress | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  // Object URLs for previews, released when replaced or cleared (not in an effect
  // cleanup: Next.js runs cleanups when it hides the page, while previews are still needed).
  const urls = useRef<string[]>([]);
  // Ignores a background-removal result that finishes after the user cancelled.
  const run = useRef(0);
  // After a save, start fresh the next time this (kept-alive) page is shown.
  const resetWhenHidden = useRef(false);

  function track(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    urls.current.push(url);
    return url;
  }

  function releaseUrls() {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
  }

  function reset() {
    run.current++;
    resetWhenHidden.current = false;
    releaseUrls();
    setPhotos(null);
    setSaved(null);
    setProgress(null);
    setKeepOriginal(false);
    setCompare("after");
    setPickError(null);
    setStep("capture");
  }

  useLayoutEffect(() => {
    return () => {
      if (!resetWhenHidden.current) return;
      // Same as reset(), using only refs and stable state setters.
      // `run` is a counter (not a DOM ref); reading its latest value here is intended.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      run.current++;
      resetWhenHidden.current = false;
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      urls.current = [];
      setPhotos(null);
      setSaved(null);
      setProgress(null);
      setKeepOriginal(false);
      setCompare("after");
      setPickError(null);
      setStep("capture");
    };
  }, []);

  async function onPick([file]: File[]) {
    reset();
    const thisRun = run.current;
    setPreparing(true);
    let original: Version;
    try {
      const { main, thumb } = await preparePhoto(file);
      original = { photo: main, thumb, url: track(main.blob) };
    } catch {
      setPickError("Couldn't open that photo. Try a JPEG or PNG, or take a new one.");
      return;
    } finally {
      setPreparing(false);
    }

    setPhotos({ original, cutout: null, cutoutFailed: false });
    setStep("removing");

    try {
      const raw = await removeBackgroundOnDevice(original.photo.blob, (p) => {
        if (run.current === thisRun) setProgress(p);
      });
      const cutout = await trimCutout(raw);
      const cutoutThumb = await resizeImage(cutout.blob, THUMB_MAX_PX, true);
      if (run.current !== thisRun) return;
      setPhotos({ original, cutout: { photo: cutout, thumb: cutoutThumb, url: track(cutout.blob) }, cutoutFailed: false });
    } catch (error) {
      console.warn("Background removal failed", error);
      if (run.current !== thisRun) return;
      setPhotos({ original, cutout: null, cutoutFailed: true });
    }
    setStep("result");
  }

  function cancelRemoval() {
    reset();
  }

  /** The version that gets saved: the cutout unless the user keeps the original (or removal failed). */
  const chosen = photos ? (photos.cutout && !keepOriginal ? photos.cutout : photos.original) : null;

  function submit(formData: FormData) {
    if (!photos || !chosen) return Promise.resolve<SaveItemResult>({ ok: false, errors: { form: "Add a photo first." } });
    formData.set("photo", chosen.photo.blob, "photo");
    formData.set("thumb", chosen.thumb.blob, "thumb");
    formData.set("original", photos.original.photo.blob, "original");
    return createItem(formData);
  }

  // ---------- D4: saved ----------
  if (step === "saved" && saved) {
    return (
      <div className="flex min-h-dvh flex-col">
        <div className="gutter flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <div className="relative">
            <div className="fc-card fc-photo h-40 w-40">
              {chosen ? <img src={chosen.url} alt="" /> : null}
            </div>
            <Sparkle size={26} className="absolute -top-3 -right-4 text-pink-400" />
            <Sparkle size={14} className="absolute bottom-3 -left-5 text-lavender-300" />
          </div>
          <Badge tone={saved.isDraft ? "draft" : "clean"}>{saved.isDraft ? "Draft" : `Item ${saved.itemNumber}`}</Badge>
          <div className="flex flex-col gap-2">
            <h1 className="type-title-lg">{saved.isDraft ? "Saved as a draft" : "Saved to your closet"}</h1>
            <p className="type-body text-ink-muted">
              {saved.isDraft
                ? "Finish tagging it from Drafts to use it in outfits."
                : `${saved.name ?? "Your new piece"} is ready for outfits.`}
            </p>
          </div>
        </div>
        <div className="gutter safe-bottom flex flex-col gap-3 pb-6">
          <Button block icon="plus" onClick={reset}>
            Add another
          </Button>
          <Button block variant="secondary" onClick={() => router.push("/closet")}>
            View closet
          </Button>
        </div>
      </div>
    );
  }

  // ---------- D3: details ----------
  if (step === "details" && photos && chosen) {
    return (
      <ItemForm
        initial={EMPTY_ITEM_VALUES}
        photoSrc={chosen.url}
        header={
          <BarHeader
            title="Item details"
            start={<IconButton icon="left" label="Back" onClick={() => setStep("result")} />}
            end={<StepCount n={3} />}
          />
        }
        photoAction={
          <button type="button" className="type-callout font-semibold text-lavender-700" onClick={reset}>
            Change photo
          </button>
        }
        submit={submit}
        onSaved={(result) => {
          setSaved(result);
          setStep("saved");
          resetWhenHidden.current = true;
        }}
      />
    );
  }

  // ---------- D2: removing ----------
  if (step === "removing" && photos) {
    const label = progressLabel(progress);
    return (
      <div className="flex min-h-dvh flex-col">
        <BarHeader title="Add an item" start={<IconButton icon="left" label="Back" onClick={cancelRemoval} />} end={<StepCount n={2} />} />
        <div className="gutter flex flex-1 flex-col gap-4 pt-2">
          <section aria-label="Removing background" aria-busy="true">
            <WindowPanel title="Bg-remove.exe" bodyClassName="flex flex-col gap-4">
              <div className="fc-scan fc-photo aspect-square rounded-[var(--radius-sm)] bg-surface-000 [--photo-pad:0px]">
                <img src={photos.original.url} alt="" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="type-pixel-lg">{label.text}</span>
                  {label.percent !== undefined ? <span className="type-pixel-sm text-ink-muted">{label.percent}%</span> : null}
                </div>
                <Progress label="Removing background" value={label.percent} />
              </div>
            </WindowPanel>
          </section>
          <p className="type-body text-ink-muted">
            {progress?.phase === "download"
              ? "First time only: downloading the background remover. After this it works offline and faster."
              : "Erasing the background on your phone. Nothing leaves it until you save."}
          </p>
        </div>
        <div className="gutter safe-bottom pt-6 pb-6">
          <Button block variant="secondary" onClick={cancelRemoval}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ---------- D2: result ----------
  if (step === "result" && photos) {
    const showing = photos.cutout && compare === "after" ? photos.cutout : photos.original;
    return (
      <div className="flex min-h-dvh flex-col">
        <BarHeader title="Add an item" start={<IconButton icon="left" label="Retake photo" onClick={reset} />} end={<StepCount n={2} />} />
        <div className="gutter flex flex-1 flex-col gap-4 pt-2">
          {photos.cutout ? (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="type-title-md">Clean cut</h2>
                <p className="type-body text-ink-muted">Check the edges. Toggle to compare with the original.</p>
              </div>
              <div className="fc-card fc-photo aspect-square">
                <img src={showing.url} alt={compare === "after" ? "Photo with background removed" : "Original photo"} />
                {showing === photos.cutout ? (
                  <Badge tone="clean" className="absolute top-3 left-3">
                    <Icon name="scissors" size={14} />
                    Background gone
                  </Badge>
                ) : null}
              </div>
              <Segmented
                label="Compare"
                options={[
                  { value: "before", label: "Before" },
                  { value: "after", label: "After" },
                ]}
                value={compare}
                onChange={(v) => v && setCompare(v)}
              />
              <div className="flex items-center justify-between gap-3">
                <span className="flex flex-col">
                  <span className="type-body-strong">Keep the original photo</span>
                  <span className="type-caption">Use it if the cutout clipped something</span>
                </span>
                <Switch label="Keep the original photo" checked={keepOriginal} onChange={setKeepOriginal} />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="type-title-md">Couldn&apos;t snip this one</h2>
                <p className="type-body text-ink-muted">The background stayed put. You can use the photo as is, or retake it on a plain background.</p>
              </div>
              <div className="fc-card fc-photo aspect-square">
                <img src={photos.original.url} alt="Original photo" />
              </div>
              {photos.cutoutFailed ? <Banner tone="warning" icon="alert">Background removal didn&apos;t work on this device or photo.</Banner> : null}
            </>
          )}
        </div>
        <div className="gutter safe-bottom flex flex-col gap-3 pt-6 pb-6">
          <Button block onClick={() => setStep("details")}>
            {photos.cutout ? "Continue" : "Use original photo"}
          </Button>
          {!photos.cutout ? (
            <Button block variant="secondary" onClick={reset}>
              Retake photo
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  // ---------- D1: capture ----------
  return (
    <div className="flex min-h-dvh flex-col">
      <BarHeader
        title="Add an item"
        start={
          <Link href="/closet" className="fc-iconbtn" aria-label="Close">
            <Icon name="close" />
          </Link>
        }
        end={<StepCount n={1} />}
      />
      <div className="gutter flex flex-1 flex-col gap-6 pt-2">
        <div className="fc-card relative grid aspect-[4/3] place-items-center overflow-hidden" style={{ background: "var(--grad-holo-hero)" }}>
          <Icon name="camera" size={56} className="text-lavender-700" />
          <Badge tone="info" className="absolute bottom-3 left-3">
            One piece per photo
          </Badge>
          <Sparkle size={20} className="absolute top-5 right-6 text-pink-400" />
        </div>
        <section aria-labelledby="framing-tips" className="flex flex-col gap-3">
          <h2 id="framing-tips" className="type-title-sm">
            Framing tips
          </h2>
          <ol className="flex flex-col gap-3">
            {["Lay it flat or hang it on a plain wall.", "Fill the frame, edges included.", "Daylight beats flash."].map((tip, i) => (
              <li key={tip} className="flex items-center gap-3">
                <Badge tone="info">{i + 1}</Badge>
                <span className="type-body">{tip}</span>
              </li>
            ))}
          </ol>
        </section>
        {pickError ? <Banner tone="error">{pickError}</Banner> : null}
      </div>
      <div className="gutter safe-bottom pt-6 pb-6">
        {preparing ? (
          <Button block loading loadingLabel="Opening photo...">
            Take photo
          </Button>
        ) : (
          <PhotoPicker onPick={onPick} />
        )}
      </div>
    </div>
  );
}

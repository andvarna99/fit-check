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
import { BarHeader } from "@/components/ui/screen-header";
import { preparePhoto, type PreparedPhoto } from "@/lib/images/prepare";

import { createItem, type SaveItemResult } from "../actions";

type Photo = { original: PreparedPhoto; main: PreparedPhoto; thumb: PreparedPhoto; previewUrl: string };
type Saved = Extract<SaveItemResult, { ok: true }>;
type Step = "capture" | "details" | "saved";

const TOTAL_STEPS = 3;

function StepCount({ n }: { n: number }) {
  return (
    <span className="type-pixel-sm text-ink-muted" aria-label={`Step ${n} of ${TOTAL_STEPS}`}>
      {n}/{TOTAL_STEPS}
    </span>
  );
}

export function AddItemFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("capture");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  // Next.js keeps visited pages alive (hidden) to preserve state. After a save,
  // start fresh the next time this flow is shown instead of re-showing "Saved".
  // An unfinished item is still preserved if the user leaves mid-way.
  const resetWhenHidden = useRef(false);
  // The preview's object URL is released only when the photo is replaced or cleared,
  // not in an effect cleanup: hiding the page runs cleanups while the photo is still needed.
  const previewUrl = useRef<string | null>(null);

  function replacePhoto(next: Photo | null) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = next?.previewUrl ?? null;
    setPhoto(next);
  }

  useLayoutEffect(() => {
    return () => {
      if (resetWhenHidden.current) {
        resetWhenHidden.current = false;
        if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
        previewUrl.current = null;
        setPhoto(null);
        setSaved(null);
        setPickError(null);
        setStep("capture");
      }
    };
  }, []);

  async function onPick([file]: File[]) {
    setPickError(null);
    setPreparing(true);
    try {
      const { main, thumb } = await preparePhoto(file);
      replacePhoto({ original: main, main, thumb, previewUrl: URL.createObjectURL(main.blob) });
      setStep("details");
    } catch {
      setPickError("Couldn't open that photo. Try a JPEG or PNG, or take a new one.");
    } finally {
      setPreparing(false);
    }
  }

  function submit(formData: FormData) {
    if (!photo) return Promise.resolve<SaveItemResult>({ ok: false, errors: { form: "Add a photo first." } });
    formData.set("photo", photo.main.blob, "photo");
    formData.set("original", photo.original.blob, "original");
    formData.set("thumb", photo.thumb.blob, "thumb");
    return createItem(formData);
  }

  function reset() {
    resetWhenHidden.current = false;
    replacePhoto(null);
    setSaved(null);
    setStep("capture");
  }

  if (step === "saved" && saved) {
    return (
      <div className="flex min-h-dvh flex-col">
        <div className="gutter flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <div className="relative">
            <div className="fc-card grid h-40 w-40 place-items-center p-4">
              {photo ? <img src={photo.previewUrl} alt="" className="h-full w-full object-contain" /> : null}
            </div>
            <Sparkle size={26} className="absolute -top-3 -right-4 text-pink-400" />
            <Sparkle size={14} className="absolute bottom-3 -left-5 text-lavender-300" />
          </div>
          <Badge tone={saved.isDraft ? "draft" : "clean"}>
            {saved.isDraft ? "Draft" : `Item ${saved.itemNumber}`}
          </Badge>
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

  if (step === "details" && photo) {
    return (
      <ItemForm
        initial={EMPTY_ITEM_VALUES}
        photoSrc={photo.previewUrl}
        header={
          <BarHeader
            title="Item details"
            start={<IconButton icon="left" label="Back" onClick={() => setStep("capture")} />}
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

/* eslint-disable @next/next/no-img-element -- local preview blobs */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { PhotoPicker } from "@/components/closet/photo-picker";
import { QuickTagSheet } from "@/components/closet/quick-tag-sheet";
import { TagFields } from "@/components/closet/tag-fields";
import { Banner } from "@/components/ui/banner";
import { Button, IconButton } from "@/components/ui/button";
import { Icon, Sparkle } from "@/components/ui/icon";
import { ItemCard } from "@/components/ui/item-card";
import { Progress } from "@/components/ui/progress";
import { BarHeader } from "@/components/ui/screen-header";
import { Segmented } from "@/components/ui/segmented";
import { WindowPanel } from "@/components/ui/window-panel";
import { applyQuickTag, isTagged, type TagValues } from "@/lib/closet/quick-tag";
import { appendPhotoFiles, processPhoto } from "@/lib/images/process-photo";

import { createItem, finalizeItems, getTagValues, quickTagItems, tagItem } from "../actions";

const MAX_PHOTOS = 50;

type EntryStatus = "queued" | "processing" | "uploading" | "done" | "failed";
type Entry = {
  key: string;
  /** Released after a successful upload to free memory. */
  file: File | null;
  status: EntryStatus;
  itemId?: string;
  name?: string | null;
  thumbUrl?: string;
  values: TagValues;
};
type Step = "select" | "processing" | "review" | "one" | "done";
type Filter = "all" | "needs" | "tagged";

const EMPTY_VALUES: TagValues = { category: null, colors: [], seasons: [], formality: null, warmth: null };

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function BulkUploadFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [overLimit, setOverLimit] = useState(0);
  const [running, setRunning] = useState(false);
  const [secondsPerPhoto, setSecondsPerPhoto] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [quickTagOpen, setQuickTagOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; drafts: number } | null>(null);

  // The processing loop reads the latest entries through a ref.
  const entriesRef = useRef<Entry[]>([]);
  const urls = useRef<string[]>([]);
  const runningRef = useRef(false);
  const generation = useRef(0);
  const resetWhenHidden = useRef(false);

  const update = useCallback((key: string, patch: Partial<Entry>) => {
    entriesRef.current = entriesRef.current.map((e) => (e.key === key ? { ...e, ...patch } : e));
    setEntries(entriesRef.current);
  }, []);

  // Selected-photo previews (F1). Revoked when the selection changes.
  const previews = useMemo(
    () => (step === "select" ? entries.slice(0, 8).map((e) => (e.file ? URL.createObjectURL(e.file) : null)) : []),
    [entries, step],
  );
  useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews]);

  // Warn before closing the tab while photos are still processing.
  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  // After finishing a batch, start fresh the next time this (kept-alive) page is shown.
  useLayoutEffect(() => {
    return () => {
      if (!resetWhenHidden.current) return;
      resetWhenHidden.current = false;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- `generation` is a counter, not a DOM ref
      generation.current++;
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      urls.current = [];
      entriesRef.current = [];
      setEntries([]);
      setResult(null);
      setSelected([]);
      setSelecting(false);
      setFilter("all");
      setStep("select");
    };
  }, []);

  function pick(files: File[]) {
    const kept = files.slice(0, MAX_PHOTOS);
    setOverLimit(Math.max(0, files.length - MAX_PHOTOS));
    entriesRef.current = kept.map((file, i) => ({
      key: `${Date.now()}-${i}`,
      file,
      status: "queued",
      values: EMPTY_VALUES,
    }));
    setEntries(entriesRef.current);
  }

  async function runQueue() {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    const gen = generation.current;
    const durations: number[] = [];
    try {
      for (;;) {
        if (generation.current !== gen) return;
        const next = entriesRef.current.find((e) => e.status === "queued");
        if (!next || !next.file) break;
        const started = performance.now();
        update(next.key, { status: "processing" });
        try {
          const processed = await processPhoto(next.file);
          if (generation.current !== gen) return;
          update(next.key, { status: "uploading" });
          const fd = new FormData();
          fd.set("intent", "draft");
          appendPhotoFiles(fd, processed);
          const saved = await createItem(fd);
          if (generation.current !== gen) return;
          if (!saved.ok) throw new Error(saved.errors.form ?? "Upload failed");
          const thumbUrl = URL.createObjectURL((processed.cutout ?? processed.original).thumb.blob);
          urls.current.push(thumbUrl);
          update(next.key, { status: "done", itemId: saved.id, thumbUrl, file: null });
        } catch (error) {
          console.warn("Bulk upload: photo failed", error);
          update(next.key, { status: "failed" });
        }
        durations.push((performance.now() - started) / 1000);
        setSecondsPerPhoto(durations.reduce((a, b) => a + b, 0) / durations.length);
      }
    } finally {
      if (generation.current === gen) {
        runningRef.current = false;
        setRunning(false);
      }
    }
  }

  function start() {
    setStep("processing");
    void runQueue();
  }

  function retryFailed() {
    entriesRef.current = entriesRef.current.map((e) => (e.status === "failed" ? { ...e, status: "queued" } : e));
    setEntries(entriesRef.current);
    void runQueue();
  }

  function cancelBatch() {
    generation.current++;
    runningRef.current = false;
    setRunning(false);
    // Photos already uploaded stay as drafts; nothing is lost.
    router.push(entriesRef.current.some((e) => e.status === "done") ? "/closet/drafts" : "/closet");
  }

  const done = entries.filter((e) => e.status === "done");
  const failed = entries.filter((e) => e.status === "failed");
  const pending = entries.filter((e) => e.status === "queued" || e.status === "processing" || e.status === "uploading");
  const taggedCount = done.filter((e) => isTagged(e.values)).length;
  const visible = done.filter((e) => (filter === "all" ? true : filter === "tagged" ? isTagged(e.values) : !isTagged(e.values)));

  // Coming back from "More details" (full edit form): refresh values from the server.
  const doneIds = done.map((e) => e.itemId!).join(",");
  useEffect(() => {
    if ((step !== "review" && step !== "one") || !doneIds) return;
    let cancelled = false;
    getTagValues(doneIds.split(",")).then((fresh) => {
      if (cancelled) return;
      entriesRef.current = entriesRef.current.map((e) => {
        const row = e.itemId ? fresh[e.itemId] : undefined;
        if (!row) return e;
        const { name, ...values } = row;
        return { ...e, name, values };
      });
      setEntries(entriesRef.current);
    });
    return () => {
      cancelled = true;
    };
    // Re-run whenever the review becomes visible again (Activity re-runs effects) or the batch grows.
  }, [step, doneIds]);

  async function saveAll(finalize: boolean) {
    setSaving(true);
    setSaveError(null);
    const ids = done.map((e) => e.itemId!);
    if (!finalize || ids.length === 0) {
      setResult({ added: 0, drafts: ids.length });
    } else {
      const res = await finalizeItems(ids);
      if (!res.ok) {
        setSaveError(res.error);
        setSaving(false);
        return;
      }
      setResult({ added: res.added, drafts: res.drafts });
    }
    setSaving(false);
    resetWhenHidden.current = true;
    setStep("done");
    router.refresh();
  }

  // ---------- F5: done ----------
  if (step === "done" && result) {
    return (
      <div className="flex min-h-dvh flex-col">
        <div className="gutter flex flex-1 flex-col justify-center gap-5">
          <div className="relative flex justify-center text-lavender-500">
            <Icon name="closet" size={64} />
            <Sparkle size={24} className="absolute top-0 right-[35%] text-pink-400" />
          </div>
          <h1 className="type-title-lg text-center">{result.added ? "Closet loaded!" : "Saved as drafts"}</h1>
          <WindowPanel title="Batch.exe · done" plain>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="type-pixel-lg">{result.added}</p>
                <p className="type-caption">Items added</p>
              </div>
              <div>
                <p className="type-pixel-lg">{result.drafts}</p>
                <p className="type-caption">Saved as drafts</p>
              </div>
            </div>
          </WindowPanel>
          {result.drafts ? <p className="type-body text-center">Finish the drafts so they show up in outfits.</p> : null}
        </div>
        <div className="gutter safe-bottom flex flex-col gap-3 pb-6">
          <Button block onClick={() => router.push("/closet")}>
            View closet
          </Button>
          {result.drafts ? (
            <Button block variant="secondary" onClick={() => router.push("/closet/drafts")}>
              Finish drafts
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  // ---------- F4: one by one ----------
  if (step === "one" && done[current]) {
    const entry = done[current];
    return (
      <OneByOne
        key={entry.key}
        entry={entry}
        position={current + 1}
        total={done.length}
        onBack={() => setStep("review")}
        onSave={async (values) => {
          const res = await tagItem(entry.itemId!, values);
          if (res.ok) update(entry.key, { values });
          return res.ok ? null : res.error;
        }}
        onMove={(delta) => {
          const target = current + delta;
          if (target < 0) return;
          if (target >= done.length) setStep("review");
          else setCurrent(target);
        }}
      />
    );
  }

  // ---------- F3: review ----------
  if (step === "review") {
    const n = selected.length;
    return (
      <div className="flex min-h-dvh flex-col">
        <BarHeader
          title={`Review ${done.length}`}
          start={<IconButton icon="left" label="Back to processing" onClick={() => setStep("processing")} />}
          end={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelecting(!selecting);
                setSelected([]);
              }}
            >
              {selecting ? "Cancel" : "Select"}
            </Button>
          }
        />
        <div className="gutter">
          <Segmented
            label="Show"
            options={[
              { value: "all", label: `All ${done.length}` },
              { value: "needs", label: `Needs tags ${done.length - taggedCount}` },
              { value: "tagged", label: `Tagged ${taggedCount}` },
            ]}
            value={filter}
            onChange={(v) => v && setFilter(v)}
            className="[&_.fc-seg__btn]:text-[13px]"
          />
        </div>
        <ul className="gutter mt-4 grid flex-1 grid-cols-3 content-start gap-2 pb-6">
          {visible.map((e) => (
            <li key={e.key} className="min-w-0">
              <ItemCard
                src={e.thumbUrl}
                name={e.name}
                tagged={isTagged(e.values)}
                draft={!isTagged(e.values)}
                selectable={selecting}
                selected={selected.includes(e.itemId!)}
                onClick={() => {
                  if (selecting) {
                    setSelected((s) => (s.includes(e.itemId!) ? s.filter((x) => x !== e.itemId) : [...s, e.itemId!]));
                  } else {
                    setCurrent(done.indexOf(e));
                    setStep("one");
                  }
                }}
              />
            </li>
          ))}
        </ul>

        {selecting ? (
          <div className="fc-actionbar items-center">
            <div className="min-w-0">
              <p className="type-pixel-sm">{n} selected</p>
              <p className="type-caption">{n ? `Same values go to all ${n}` : "Tap items to select them"}</p>
            </div>
            <Button className="flex-none" disabled={n === 0} onClick={() => setQuickTagOpen(true)}>
              Quick-tag
            </Button>
          </div>
        ) : (
          <div className="fc-actionbar flex-col">
            {saveError ? <Banner tone="error">{saveError}</Banner> : null}
            <p className="type-caption text-center">
              {pending.length
                ? `Waiting for ${plural(pending.length, "more photo")}...`
                : `${plural(taggedCount, "tagged item")} join your closet. ${done.length - taggedCount} untagged save as drafts.`}
            </p>
            <div className="flex gap-3 [&>*]:flex-1">
              <Button variant="secondary" disabled={pending.length > 0 || saving} onClick={() => saveAll(false)}>
                Save drafts
              </Button>
              <Button disabled={pending.length > 0} loading={saving} loadingLabel="Saving..." onClick={() => saveAll(true)}>
                Save all
              </Button>
            </div>
          </div>
        )}

        <QuickTagSheet
          open={quickTagOpen}
          onClose={() => setQuickTagOpen(false)}
          thumbs={done.filter((e) => selected.includes(e.itemId!)).map((e) => e.thumbUrl ?? null)}
          onApply={async (patch) => {
            const res = await quickTagItems(selected, patch, false);
            if (!res.ok) return res.error;
            entriesRef.current = entriesRef.current.map((e) =>
              e.itemId && selected.includes(e.itemId) ? { ...e, values: applyQuickTag(e.values, patch) } : e,
            );
            setEntries(entriesRef.current);
            setSelecting(false);
            setSelected([]);
            return null;
          }}
        />
      </div>
    );
  }

  // ---------- F2: processing ----------
  if (step === "processing") {
    const total = entries.length;
    const finished = done.length + failed.length;
    const left = secondsPerPhoto && pending.length ? Math.max(1, Math.round((secondsPerPhoto * pending.length) / 60)) : null;
    return (
      <div className="flex min-h-dvh flex-col">
        <BarHeader title="Bulk upload" start={<IconButton icon="close" label="Stop and keep uploaded photos" onClick={cancelBatch} />} />
        <div className="gutter flex flex-1 flex-col gap-4 pt-2">
          <WindowPanel title="Batch.exe">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="type-pixel-lg">{pending.length ? "Removing bgs" : "All done"}</span>
                <span className="type-pixel-lg">
                  {finished}/{total}
                </span>
              </div>
              <Progress label="Removing backgrounds" value={total ? (finished / total) * 100 : 0} />
              <p className="type-caption">
                {pending.length
                  ? left
                    ? `About ${plural(left, "minute")} left. Keep the app open.`
                    : "Keep the app open while photos process."
                  : "Every photo is processed."}
              </p>
            </div>
          </WindowPanel>

          {failed.length ? (
            <Banner tone="error">
              <span className="flex items-center justify-between gap-2">
                Couldn&apos;t upload {plural(failed.length, "photo")}.
                <Button variant="ghost" size="sm" onClick={retryFailed} disabled={running}>
                  Retry
                </Button>
              </span>
            </Banner>
          ) : null}

          <ul className="grid grid-cols-3 gap-2" aria-label="Photos">
            {entries.map((e, i) => (
              <li key={e.key} className="fc-card fc-photo aspect-square [--photo-pad:8px]" aria-label={`Photo ${i + 1}: ${e.status}`}>
                {e.thumbUrl ? (
                  <img src={e.thumbUrl} alt="" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className={`type-pixel-sm ${e.status === "failed" ? "text-danger" : "text-ink-muted"}`}>
                      {e.status === "failed" ? "Failed" : e.status === "queued" ? "" : "..."}
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="fc-actionbar flex-col">
          <Button block disabled={done.length === 0} onClick={() => setStep("review")}>
            Start review
          </Button>
          <p className="type-caption text-center">
            {pending.length && done.length
              ? `Review the ${done.length} that ${done.length === 1 ? "is" : "are"} ready. The rest keep processing.`
              : !pending.length
                ? `All ${plural(done.length, "photo")} ready to tag.`
                : "The first photo will be ready in a moment."}
          </p>
        </div>
      </div>
    );
  }

  // ---------- F1: select ----------
  const count = entries.length;
  return (
    <div className="flex min-h-dvh flex-col">
      <BarHeader
        title="Bulk upload"
        start={
          <Link href="/closet" className="fc-iconbtn" aria-label="Close">
            <Icon name="close" />
          </Link>
        }
      />
      <div className="gutter flex flex-1 flex-col gap-5 pt-2">
        <div className="flex flex-col gap-1">
          <h2 className="type-title-md">Load up your closet</h2>
          <p className="type-body text-ink-muted">
            Pick as many photos as you like. Backgrounds come off automatically, then you tag them in batches.
          </p>
        </div>

        {count ? (
          <section className="fc-card flex flex-col gap-3 p-4" aria-labelledby="selected-title">
            <div className="flex items-center justify-between">
              <h3 id="selected-title" className="type-pixel-lg">
                {count} selected
              </h3>
              <PhotoPicker onPick={pick} multiple camera={false} libraryLabel="Change" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <span key={i} className="fc-photo aspect-square rounded-[var(--radius-sm)] bg-surface-100 [--photo-pad:0px]">
                  {src ? <img src={src} alt="" className="object-cover" /> : null}
                </span>
              ))}
            </div>
            {count > 8 ? <p className="type-caption">Plus {count - 8} more</p> : null}
          </section>
        ) : null}

        {overLimit ? (
          <Banner tone="warning" icon="alert">
            {MAX_PHOTOS} photos per batch. The other {overLimit} weren&apos;t added; upload them in another batch.
          </Banner>
        ) : null}

        <ul className="flex flex-col gap-3">
          <li className="flex items-center gap-3">
            <Icon name="hanger" size={20} className="text-lavender-700" />
            <span className="type-body">One piece per photo works best.</span>
          </li>
          <li className="flex items-center gap-3">
            <Icon name="pencil" size={20} className="text-lavender-700" />
            <span className="type-body">Untagged items save as drafts. Finish them anytime.</span>
          </li>
        </ul>
      </div>
      <div className="gutter safe-bottom pt-6 pb-6">
        {count ? (
          <Button block onClick={start}>
            Start upload
          </Button>
        ) : (
          <PhotoPicker onPick={pick} multiple camera={false} libraryLabel="Choose photos" />
        )}
      </div>
    </div>
  );
}

type OneByOneProps = {
  entry: Entry;
  position: number;
  total: number;
  onBack: () => void;
  /** Resolves to an error message, or null when saved. */
  onSave: (values: TagValues) => Promise<string | null>;
  onMove: (delta: number) => void;
};

function OneByOne({ entry, position, total, onBack, onSave, onMove }: OneByOneProps) {
  const router = useRouter();
  const [values, setValues] = useState<TagValues>(entry.values);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(entry.values);

  async function go(delta: number) {
    if (dirty) {
      setSaving(true);
      setError(null);
      const message = await onSave(values);
      setSaving(false);
      if (message) {
        setError(message);
        return;
      }
    }
    onMove(delta);
  }

  const set = <K extends keyof TagValues>(key: K) => (value: TagValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  return (
    <div className="flex min-h-dvh flex-col">
      <BarHeader
        title={
          <span className="type-pixel-lg not-italic" aria-live="polite">
            <span className="sr-only">Item </span>
            {position} / {total}
          </span>
        }
        start={<IconButton icon="left" label="Back to review queue" onClick={onBack} />}
        end={
          <Button variant="ghost" size="sm" onClick={() => onMove(1)} disabled={saving}>
            Skip
          </Button>
        }
      />
      <div className="gutter flex flex-1 flex-col gap-5 pb-6">
        <div className="fc-card fc-photo mx-auto aspect-square w-48">{entry.thumbUrl ? <img src={entry.thumbUrl} alt="" /> : null}</div>
        {error ? <Banner tone="error">{error}</Banner> : null}
        <TagFields
          categoryRequired
          category={values.category}
          onCategory={set("category")}
          colors={values.colors}
          onColors={set("colors")}
          seasons={values.seasons}
          onSeasons={set("seasons")}
          formality={values.formality}
          onFormality={set("formality")}
          warmth={values.warmth}
          onWarmth={set("warmth")}
        />
        <Link
          href={`/closet/${entry.itemId}/edit?returnTo=/closet/bulk`}
          className="type-callout inline-flex items-center gap-1 font-semibold text-lavender-700"
          onClick={async (e) => {
            if (!dirty) return;
            e.preventDefault();
            const message = await onSave(values);
            if (message) setError(message);
            else router.push(`/closet/${entry.itemId}/edit?returnTo=/closet/bulk`);
          }}
        >
          More details
          <Icon name="right" size={18} />
        </Link>
      </div>
      <div className="fc-actionbar">
        <IconButton icon="left" label="Previous item" variant="tonal" className="flex-none" disabled={position === 1 || saving} onClick={() => go(-1)} />
        <Button loading={saving} loadingLabel="Saving..." onClick={() => go(1)}>
          {position === total ? "Done" : "Next"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

const DURATION_MS = 10_000;
const TICK_MS = 50;

export default function EntriesTableClient({ rows }) {
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [winnerIndex, setWinnerIndex] = useState(-1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isPreviewScriptReady, setIsPreviewScriptReady] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [previewToken, setPreviewToken] = useState("");
  const [previewStatus, setPreviewStatus] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const intervalRef = useRef(null);
  const previewRef = useRef(null);

  const n = rows.length;
  const canPick = n > 0 && !isSpinning;

  const clearSpinTimer = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearSpinTimer(), [clearSpinTimer]);

  const closePreview = useCallback(() => {
    if (previewRef.current) {
      previewRef.current.removeAllListeners?.();
      previewRef.current.hide?.();
      previewRef.current = null;
    }

    setSelectedRow(null);
    setPreviewToken("");
    setPreviewStatus("");
    setPreviewError("");
    setIsPreviewLoading(false);
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closePreview();
      }
    }

    if (selectedRow) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePreview, selectedRow]);

  useEffect(() => {
    if (!selectedRow || !isPreviewScriptReady || !previewToken || !window.Box) {
      return undefined;
    }

    const Preview = window.Box.Preview || window.Box.ContentPreview;

    if (!Preview) {
      setPreviewError("Box Content Preview is unavailable.");
      setIsPreviewLoading(false);
      return undefined;
    }

    const preview = new Preview();
    previewRef.current = preview;

    preview.addListener?.("load", (data = {}) => {
      if (data.error) {
        setPreviewError(data.error);
        setIsPreviewLoading(false);
        return;
      }

      setPreviewStatus("");
      setIsPreviewLoading(false);
    });

    preview.addListener?.("notification", (data = {}) => {
      if (data.type === "error") {
        setPreviewError(data.message || "Unable to preview this file.");
      }
    });

    preview.show(selectedRow.id, previewToken, {
      container: "#box-preview-container",
      header: "light",
      showDownload: false,
    });

    return () => {
      preview.removeAllListeners?.();
      preview.hide?.();
      if (previewRef.current === preview) {
        previewRef.current = null;
      }
    };
  }, [isPreviewScriptReady, previewToken, selectedRow]);

  const openPreview = useCallback(async (row) => {
    if (!row?.id) {
      return;
    }

    setSelectedRow(row);
    setPreviewToken("");
    setPreviewError("");
    setPreviewStatus("Preparing preview.");
    setIsPreviewLoading(true);

    try {
      const params = new URLSearchParams({ fileId: row.id });
      const response = await fetch(`/api/box/preview-token?${params}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to prepare preview.");
      }

      setPreviewToken(data.accessToken);
      setPreviewStatus("Loading preview.");
    } catch (error) {
      setPreviewError(error.message);
      setPreviewStatus("");
      setIsPreviewLoading(false);
    }
  }, []);

  const pickWinner = useCallback(() => {
    if (!canPick) {
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReduced) {
      const w = Math.floor(Math.random() * n);
      setHighlightIndex(w);
      setWinnerIndex(w);
      return;
    }

    const winner = Math.floor(Math.random() * n);
    const lastTick = Math.max(0, Math.ceil(DURATION_MS / TICK_MS) - 1);
    const startIndex = ((winner - lastTick) % n + n) % n;
    const startedAt = Date.now();

    setWinnerIndex(-1);
    setIsSpinning(true);
    setHighlightIndex(startIndex);

    clearSpinTimer();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const tick = Math.min(lastTick, Math.floor(elapsed / TICK_MS));

      if (elapsed >= DURATION_MS) {
        clearSpinTimer();
        setHighlightIndex(winner);
        setWinnerIndex(winner);
        setIsSpinning(false);
        return;
      }

      setHighlightIndex((startIndex + tick) % n);
    }, TICK_MS);
  }, [canPick, clearSpinTimer, n]);

  return (
    <div className="entries-table-wrap">
      <Script
        src="https://cdn01.boxcdn.net/platform/elements/26.0.0/en-US/preview.js"
        strategy="afterInteractive"
        onLoad={() => setIsPreviewScriptReady(true)}
        onError={() => setPreviewError("Unable to load Box Content Preview.")}
      />

      <div className="entries-toolbar">
        <button
          type="button"
          className="submit-button entries-pick-button"
          onClick={pickWinner}
          disabled={!canPick}
        >
          {isSpinning ? "Picking…" : "Pick Winner"}
        </button>
        <p className="entries-toolbar-hint" aria-live="polite">
          {isSpinning
            ? "Cycling entries — winner in 10 seconds."
            : winnerIndex >= 0 && rows[winnerIndex]
              ? `Winner: ${rows[winnerIndex].name}`
              : " "}
        </p>
      </div>

      <div className="entries-panel">
        <table className="entries-table">
          <thead>
            <tr>
              <th scope="col">File name</th>
              <th scope="col">First name</th>
              <th scope="col">Last name</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="entries-empty">
                  No files in this folder yet.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const isCycle = isSpinning && index === highlightIndex;
                const isWinner =
                  !isSpinning && winnerIndex >= 0 && index === winnerIndex;

                return (
                  <tr
                    key={row.id}
                    tabIndex={0}
                    className={
                      isWinner
                        ? "entries-row-winner"
                        : isCycle
                          ? "entries-row-cycle"
                          : undefined
                    }
                    aria-current={isWinner ? "true" : undefined}
                    onClick={() => openPreview(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openPreview(row);
                      }
                    }}
                  >
                    <td className="entries-file-name">{row.name}</td>
                    <td>{row.firstName || "—"}</td>
                    <td>{row.lastName || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedRow ? (
        <div
          className="entries-preview-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePreview();
            }
          }}
        >
          <section
            className="entries-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="entries-preview-title"
          >
            <header className="entries-preview-header">
              <div>
                <h2 id="entries-preview-title">{selectedRow.name}</h2>
                <p>{[selectedRow.firstName, selectedRow.lastName].filter(Boolean).join(" ") || "Raffle file"}</p>
              </div>
              <button
                type="button"
                className="entries-preview-close"
                onClick={closePreview}
                aria-label="Close preview"
              >
                &times;
              </button>
            </header>

            <div className="entries-preview-body">
              {(isPreviewLoading || previewStatus || previewError) && (
                <div
                  className={`entries-preview-status ${
                    previewError ? "error" : "idle"
                  }`}
                  role="status"
                >
                  {previewError || previewStatus}
                </div>
              )}
              <div id="box-preview-container" className="entries-preview-target" />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

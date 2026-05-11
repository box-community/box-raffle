"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DURATION_MS = 10_000;
const TICK_MS = 50;

export default function EntriesTableClient({ rows }) {
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [winnerIndex, setWinnerIndex] = useState(-1);
  const [isSpinning, setIsSpinning] = useState(false);
  const intervalRef = useRef(null);

  const n = rows.length;
  const canPick = n > 0 && !isSpinning;

  const clearSpinTimer = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearSpinTimer(), [clearSpinTimer]);

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
                    className={
                      isWinner
                        ? "entries-row-winner"
                        : isCycle
                          ? "entries-row-cycle"
                          : undefined
                    }
                    aria-current={isWinner ? "true" : undefined}
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
    </div>
  );
}

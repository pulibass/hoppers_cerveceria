"use client";

import { useEffect, useRef, useState } from "react";

export type NavEntry = { anchor: string; label: string };

/** Sticky horizontal category bar. Highlights the section in view and keeps its chip visible. */
export function CategoryNav({ entries }: { entries: NavEntry[] }) {
  const [active, setActive] = useState(entries[0]?.anchor ?? "");
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const sections = entries.map(entry => document.getElementById(entry.anchor)).filter((node): node is HTMLElement => node !== null);
    if (!sections.length || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      observed => {
        const visible = observed.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [entries]);

  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>(`[data-anchor="${CSS.escape(active)}"]`);
    if (!list || !chip) return;
    const target = chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ left: Math.max(0, target), behavior: reduce ? "auto" : "smooth" });
  }, [active]);

  return (
    <nav className="category-nav" aria-label="Categorías de la carta">
      <ul ref={listRef} className="category-nav-list">
        {entries.map(entry => (
          <li key={entry.anchor}>
            <a
              href={`#${entry.anchor}`}
              data-anchor={entry.anchor}
              className={entry.anchor === active ? "is-active" : undefined}
              aria-current={entry.anchor === active ? "location" : undefined}
              onClick={() => setActive(entry.anchor)}
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

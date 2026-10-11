import type { CategoryIcon } from "@/lib/menu/types";

// Line drawings used as elegant fallbacks when a product has no photo,
// plus small decorative accents (leaves, chili) for the editorial layout.

const paths: Record<CategoryIcon, React.ReactNode> = {
  glass: <><path d="M15 10h18l-2.5 30h-13z" /><path d="M16.5 20h15" /><path d="M24 4v12" /><circle cx="21" cy="28" r="1.4" /><circle cx="26" cy="33" r="1.1" /></>,
  gin: <><path d="M14 9h20l-2 31H16z" /><path d="M15 17h18" /><circle cx="27" cy="26" r="5" /><path d="M27 21v10M22 26h10" /><path d="M20 4l6 13" /></>,
  whisky: <><path d="M12 16h24l-2 24H14z" /><path d="M13 26h22" /><rect x="17" y="19" width="7" height="6" rx="1" transform="rotate(-8 20 22)" /><rect x="24" y="20" width="7" height="6" rx="1" transform="rotate(10 27 23)" /></>,
  wine: <><path d="M16 6h16c0 11-3 17-8 17s-8-6-8-17z" /><path d="M17 13h14" /><path d="M24 23v15" /><path d="M17 42h14" /></>,
  beer: <><path d="M12 14h20v26a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2z" /><path d="M32 19h4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-4" /><path d="M12 14c0-4 3-6 6-5 1-3 6-4 8-1 3-2 7 0 6 4" /><path d="M18 21v15M24 21v15" /></>,
  bottle: <><path d="M20 4h8v8c0 3 5 5 5 11v17a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V23c0-6 5-8 5-11z" /><path d="M15 25h18M15 34h18" /></>,
  cocktail: <><path d="M9 10h30L24 26z" /><path d="M24 26v14" /><path d="M16 42h16" /><circle cx="33" cy="8" r="4" /><path d="M14 15h20" /></>,
  fries: <><path d="M13 22h22l-3 20H16z" /><path d="M16 22l-2-13M21 22l-1-16M26 22l1-15M31 22l3-12" /><path d="M18 30c2 2 10 2 12 0" /></>,
  snack: <><path d="M8 32c0-9 7-16 16-16s16 7 16 16z" /><path d="M6 32h36" /><path d="M14 16l-4-8M24 16V6M34 16l4-8" /><circle cx="19" cy="25" r="1.5" /><circle cx="28" cy="23" r="1.5" /></>,
  pizza: <><path d="M24 42L8 12c10-5 22-5 32 0z" /><path d="M10 17c9-4 19-4 28 0" /><circle cx="20" cy="22" r="2.4" /><circle cx="28" cy="25" r="2.4" /><circle cx="24" cy="33" r="2" /></>,
  burger: <><path d="M9 21c0-8 7-13 15-13s15 5 15 13z" /><path d="M8 26h32" /><path d="M9 30c3 2 6-2 9 0s6-2 9 0 6-2 9 0 3 0 3 0" /><path d="M10 35h28v3a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z" /><path d="M18 14l1 1M26 13l1 1M31 16l1 1" /></>,
  leaf: <><path d="M10 38C10 20 22 9 40 8c0 18-11 30-28 30z" /><path d="M10 38L30 18" /><path d="M18 30h8M22 26v-7" /></>,
  sandwich: <><path d="M6 20L24 9l18 11z" /><path d="M7 25h34" /><path d="M7 25c3 3 6-1 9 1s6-2 9 0 6-2 9 0 4 0 7-1" /><path d="M7 32h34l-2 6H9z" /></>,
  dessert: <><path d="M10 26h28l-3 14H13z" /><path d="M10 26c0-7 6-12 14-12s14 5 14 12" /><circle cx="24" cy="9" r="3.5" /><path d="M17 33h14" /></>,
  plus: <><circle cx="24" cy="24" r="15" /><path d="M24 16v16M16 24h16" /></>,
};

export function CategoryArt({ icon, className }: { icon: CategoryIcon; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[icon]}
    </svg>
  );
}

export function Leaf({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 40" aria-hidden="true">
      <path d="M2 30C14 6 40 0 62 8 48 30 22 38 2 30z" fill="currentColor" opacity=".92" />
      <path d="M4 29C22 22 40 14 60 9" stroke="rgba(0,0,0,.35)" strokeWidth="1.3" fill="none" />
      <path d="M20 23l4-9M32 18l5-9M43 14l4-6M26 21l8 5M38 16l8 4" stroke="rgba(0,0,0,.22)" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function Chili({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M12 14c6 0 10 5 12 12s7 13 17 16c-12 3-26-3-31-14-2-6-1-12 2-14z" fill="currentColor" />
      <path d="M12 14c-1-4 1-8 5-10 0 3-1 6-2 8" stroke="#6d9443" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

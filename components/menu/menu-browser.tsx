"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { PublicSection } from "@/lib/menu/public-view";
import type { Category, Product } from "@/lib/menu/types";
import { CategoryNav, type NavEntry } from "./category-nav";
import { CategorySection, HappyHourSection, type Notices } from "./menu-sections";
import { ProductDialog, type Selection } from "./product-dialog";

/** Interactive part of the public menu: category navigation, sections and the product dialog. */
export function MenuBrowser({ sections, notices }: { sections: PublicSection[]; notices: Notices }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const select = useCallback((product: Product, category: Category, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setSelection({ product, category });
  }, []);
  const close = useCallback(() => setSelection(null), []);

  const navEntries = useMemo<NavEntry[]>(
    () => sections.map(section => ({
      anchor: section.anchor,
      label: section.kind === "category" ? section.category.name : section.happyHour.title,
    })),
    [sections],
  );

  return (
    <>
      <CategoryNav entries={navEntries} />
      <div className="menu-body">
        {sections.map(section => {
          if (section.kind === "happyHour") {
            return <HappyHourSection key={section.anchor} anchor={section.anchor} happyHour={section.happyHour} notice={notices.alcohol} />;
          }
          return (
            <CategorySection
              key={section.anchor}
              anchor={section.anchor}
              category={section.category}
              index={section.number}
              notices={notices}
              onSelect={select}
            />
          );
        })}
      </div>
      <ProductDialog selection={selection} notices={notices} onClose={close} returnFocusTo={triggerRef} />
    </>
  );
}

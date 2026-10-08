"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ActivePanel } from "@/types/studio";
import { cn } from "@/lib/utils";

interface SidePanelProps {
  activePanel: ActivePanel;
  onClose: () => void;
  children: React.ReactNode;
  isMobileSheetOpen?: boolean;
  onMobileSheetClose?: () => void;
}

export function SidePanel({
  activePanel,
  onClose,
  children,
  isMobileSheetOpen = false,
  onMobileSheetClose,
}: SidePanelProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  if (!activePanel) {
    return null;
  }

  return (
    <>
      {/* Desktop side panel (380px collapsible) */}
      <aside
        className={cn(
          "side-panel hidden md:flex flex-col w-[380px] h-[calc(100vh-56px-32px)] border-r border-border bg-surface flex-shrink-0 z-20 shadow-md transition-all duration-200 relative",
          !activePanel && "w-0 overflow-hidden"
        )}
      >
        {/* Close / Collapse tab */}
        <button
          onClick={onClose}
          className="absolute -right-3 top-3 z-30 h-6 w-6 rounded-full bg-surface border border-border shadow-xs flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover"
          title="Fermer le volet"
          aria-label="Fermer le volet"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 h-full overflow-hidden flex flex-col">
          {children}
        </div>
      </aside>

      {/* Mobile/Tablet Sheet Drawer */}
      <div className="md:hidden">
        <Sheet
          open={isMobileSheetOpen || (!!activePanel && isMobile)}
          onOpenChange={(open) => {
            if (!open) {
              onClose();
              onMobileSheetClose?.();
            }
          }}
        >
          <SheetContent side="left" className="w-[85vw] max-w-[380px] p-0 flex flex-col">
            <div className="flex-1 h-full overflow-hidden flex flex-col pt-6">
              {children}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

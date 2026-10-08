"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const [panelWidth, setPanelWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Resize handler for desktop (320px to 480px)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // IconRail width is 72px
      const newWidth = Math.max(320, Math.min(480, e.clientX - 72));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  if (!activePanel) {
    return null;
  }

  return (
    <>
      {/* Desktop resizable side panel (320px - 480px, default 360px) */}
      <aside
        ref={panelRef}
        style={{ width: `${panelWidth}px` }}
        className={cn(
          "side-panel hidden md:flex flex-col h-[calc(100vh-56px-32px)] border-r border-border bg-surface flex-shrink-0 z-20 shadow-sm relative transition-none select-none pb-4",
          isResizing && "select-none"
        )}
      >
        {/* Collapse toggle button */}
        <button
          onClick={onClose}
          className="absolute -right-3 top-3 z-30 h-6 w-6 rounded-full bg-surface-2 shadow-xs flex items-center justify-center text-muted hover:text-text cursor-pointer transition-colors"
          title="Fermer le volet"
          aria-label="Fermer le volet"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Content container */}
        <div className="flex-1 h-full overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Resizer grip line on right border */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 transition-colors z-30"
          title="Glisser pour redimensionner"
        />
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
          <SheetContent side="left" className="w-[85vw] max-w-[360px] p-0 flex flex-col bg-surface border-r border-border">
            <div className="flex-1 h-full overflow-hidden flex flex-col pt-6 pb-6">
              {children}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

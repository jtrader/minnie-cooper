import type { ReactNode } from "react";
import { Redo2, Undo2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export type HistoryContextMenuProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  children: ReactNode;
  className?: string;
};

/** Right-click Undo/Redo, sharing the exact handlers used by the toolbar. */
export function HistoryContextMenu({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  children,
  className,
}: HistoryContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className={className}>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem disabled={!canUndo} onSelect={() => onUndo()}>
          <Undo2 className="mr-2 h-3.5 w-3.5" />
          Undo
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">Ctrl+Z</span>
        </ContextMenuItem>
        <ContextMenuItem disabled={!canRedo} onSelect={() => onRedo()}>
          <Redo2 className="mr-2 h-3.5 w-3.5" />
          Redo
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">Ctrl+Shift+Z</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

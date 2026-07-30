import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { McpTool } from "@/lib/kraken/types";

type ToolPickerProps = {
  tools: McpTool[];
  value?: string;
  onChange: (name: string) => void;
  label?: string;
};

export function ToolPicker({ tools, value, onChange, label = "Tool" }: ToolPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-[220px] font-mono text-xs">
          <SelectValue placeholder="Select a tool" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {tools.map((tool) => (
            <SelectItem key={tool.name} value={tool.name} className="font-mono text-xs">
              {tool.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
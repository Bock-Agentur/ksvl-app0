/**
 * GradientEditor Component
 * 
 * UI for editing CSS gradient backgrounds.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GradientEditorProps {
  value: string | null;
  onChange: (value: string) => void;
}

export function GradientEditor({ value, onChange }: GradientEditorProps) {
  const gradientValue = value || 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))';
  
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
      <Label>Gradient CSS</Label>
      <Input
        value={gradientValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder="z.B. linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        className="font-mono text-sm"
      />
      <p className="text-xs text-muted-foreground">
        Gib einen CSS-Gradient ein. Beispiele: 
        linear-gradient(135deg, #667eea, #764ba2) oder 
        radial-gradient(circle, #ff6b6b, #4ecdc4)
      </p>
      <div 
        className="w-full h-20 rounded border"
        style={{ background: gradientValue }}
      />
    </div>
  );
}

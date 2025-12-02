/**
 * BackgroundModeSelector Component
 * 
 * UI for selecting background type: gradient, image, or video.
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface BackgroundModeSelectorProps {
  type: 'gradient' | 'image' | 'video';
  onChange: (type: 'gradient' | 'image' | 'video') => void;
}

export function BackgroundModeSelector({ type, onChange }: BackgroundModeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Hintergrund-Typ</Label>
      <div className="flex gap-4">
        <Button
          variant={type === 'gradient' ? 'default' : 'outline'}
          onClick={() => onChange('gradient')}
          className="flex-1"
        >
          Gradient
        </Button>
        <Button
          variant={type === 'image' ? 'default' : 'outline'}
          onClick={() => onChange('image')}
          className="flex-1"
        >
          Bild
        </Button>
        <Button
          variant={type === 'video' ? 'default' : 'outline'}
          onClick={() => onChange('video')}
          className="flex-1"
        >
          Video
        </Button>
      </div>
    </div>
  );
}

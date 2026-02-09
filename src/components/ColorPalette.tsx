import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  showCustomPicker?: boolean;
}

export function ColorPalette({ selectedColor, onColorSelect, showCustomPicker = true }: ColorPaletteProps) {
  const PRESET_COLORS = [
    // Reds & Pinks
    '#EF4444', '#F87171', '#FB7185', '#EC4899',
    // Oranges & Yellows
    '#F97316', '#FB923C', '#FFF53F', '#FBBF24',
    // Greens
    '#10B981', '#34D399', '#22C55E', '#84CC16',
    // Blues & Cyans
    '#3B82F6', '#60A5FA', '#06B3C4', '#22D3EE',
    // Purples
    '#8B5CF6', '#A78BFA', '#C084FC', '#D946EF',
    // Neutrals
    '#6B7280', '#9CA3AF', '#1F2937', '#000000'
  ];

  return (
    <div className="space-y-3">
      {/* Preset Colors Grid */}
      <div className="grid grid-cols-6 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onColorSelect(color)}
            className={`w-10 h-10 rounded-md border-2 transition-all hover:scale-110 ${
              selectedColor.toUpperCase() === color.toUpperCase()
                ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900'
                : 'border-gray-200 hover:border-gray-400'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Optional Custom Color Picker */}
      {showCustomPicker && (
        <div className="pt-2 border-t">
          <Label className="text-xs text-gray-500 mb-2 block">Or choose custom color:</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => onColorSelect(e.target.value.toUpperCase())}
              className="h-9 w-16 cursor-pointer rounded border border-gray-200 bg-white"
            />
            <Input
              value={selectedColor}
              onChange={(e) => onColorSelect(e.target.value.toUpperCase())}
              placeholder="#FFCAEC"
              className="flex-1 font-mono text-sm"
              maxLength={7}
            />
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';

const DDI_OPTIONS = [
  { code: '+55', flag: '🇧🇷', label: 'Brasil' },
  { code: '+1', flag: '🇺🇸', label: 'EUA/Canadá' },
  { code: '+351', flag: '🇵🇹', label: 'Portugal' },
  { code: '+54', flag: '🇦🇷', label: 'Argentina' },
  { code: '+598', flag: '🇺🇾', label: 'Uruguai' },
  { code: '+595', flag: '🇵🇾', label: 'Paraguai' },
  { code: '+56', flag: '🇨🇱', label: 'Chile' },
  { code: '+57', flag: '🇨🇴', label: 'Colômbia' },
  { code: '+52', flag: '🇲🇽', label: 'México' },
  { code: '+34', flag: '🇪🇸', label: 'Espanha' },
  { code: '+39', flag: '🇮🇹', label: 'Itália' },
  { code: '+44', flag: '🇬🇧', label: 'Reino Unido' },
  { code: '+49', flag: '🇩🇪', label: 'Alemanha' },
  { code: '+33', flag: '🇫🇷', label: 'França' },
  { code: '+81', flag: '🇯🇵', label: 'Japão' },
];

interface PhoneFieldWithDDIProps {
  value: string;
  onChange: (fullValue: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  readOnly?: boolean;
}

export function PhoneFieldWithDDI({
  value,
  onChange,
  placeholder = '(00) 00000-0000',
  style,
  className = '',
  readOnly = false,
}: PhoneFieldWithDDIProps) {
  // Parse existing value to extract DDI and number
  const parseValue = useCallback((val: string) => {
    if (!val) return { ddi: '+55', number: '' };
    const trimmed = val.trim();
    // Check if starts with a known DDI
    for (const opt of DDI_OPTIONS) {
      if (trimmed.startsWith(opt.code)) {
        return { ddi: opt.code, number: trimmed.slice(opt.code.length).trim() };
      }
    }
    // Check if starts with + (unknown DDI)
    if (trimmed.startsWith('+')) {
      const match = trimmed.match(/^(\+\d{1,4})\s*(.*)/);
      if (match) return { ddi: match[1], number: match[2] };
    }
    return { ddi: '+55', number: trimmed };
  }, []);

  const parsed = parseValue(value);
  const [selectedDDI, setSelectedDDI] = useState(parsed.ddi);
  const localNumber = parsed.number;

  const handleDDIChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDDI = e.target.value;
    setSelectedDDI(newDDI);
    if (localNumber) {
      onChange(`${newDDI}${localNumber}`);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d\s()-]/g, '');
    onChange(`${selectedDDI}${num}`);
  };

  const currentOption = DDI_OPTIONS.find(o => o.code === selectedDDI);

  return (
    <div className={`flex gap-1 ${className}`}>
      <select
        value={selectedDDI}
        onChange={handleDDIChange}
        disabled={readOnly}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
        style={{
          ...style,
          width: 'auto',
          minWidth: '90px',
          cursor: readOnly ? 'default' : 'pointer',
        }}
        aria-label="DDI"
      >
        {DDI_OPTIONS.map(opt => (
          <option key={opt.code} value={opt.code}>
            {opt.flag} {opt.code}
          </option>
        ))}
      </select>
      <Input
        type="tel"
        placeholder={placeholder}
        value={localNumber}
        onChange={handleNumberChange}
        readOnly={readOnly}
        className={readOnly ? 'pointer-events-none flex-1' : 'flex-1'}
        style={style}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DDI_OPTIONS = [
  { code: '55', label: '🇧🇷 +55', country: 'Brasil' },
  { code: '1', label: '🇺🇸 +1', country: 'EUA' },
  { code: '351', label: '🇵🇹 +351', country: 'Portugal' },
  { code: '54', label: '🇦🇷 +54', country: 'Argentina' },
  { code: '56', label: '🇨🇱 +56', country: 'Chile' },
  { code: '57', label: '🇨🇴 +57', country: 'Colômbia' },
  { code: '52', label: '🇲🇽 +52', country: 'México' },
  { code: '598', label: '🇺🇾 +598', country: 'Uruguai' },
  { code: '595', label: '🇵🇾 +595', country: 'Paraguai' },
  { code: '34', label: '🇪🇸 +34', country: 'Espanha' },
  { code: '44', label: '🇬🇧 +44', country: 'Reino Unido' },
  { code: '49', label: '🇩🇪 +49', country: 'Alemanha' },
  { code: '33', label: '🇫🇷 +33', country: 'França' },
  { code: '39', label: '🇮🇹 +39', country: 'Itália' },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

/**
 * Parses a full phone number into DDI code and local number.
 * If the number starts with a known DDI, it splits accordingly.
 * Otherwise defaults to '55' (Brazil).
 */
function parsePhone(fullNumber: string): { ddi: string; local: string } {
  const cleaned = fullNumber.replace(/\D/g, '');

  if (!cleaned) return { ddi: '55', local: '' };

  // Try matching longest DDI first (3 digits, then 2, then 1)
  for (const len of [3, 2, 1]) {
    const prefix = cleaned.substring(0, len);
    const match = DDI_OPTIONS.find((d) => d.code === prefix);
    if (match) {
      return { ddi: match.code, local: cleaned.substring(len) };
    }
  }

  // Default to Brazil
  return { ddi: '55', local: cleaned };
}

function formatLocalBR(local: string): string {
  const digits = local.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function PhoneInput({ value, onChange, placeholder, id, className }: PhoneInputProps) {
  const parsed = parsePhone(value || '');
  const [ddi, setDdi] = useState(parsed.ddi);
  const [local, setLocal] = useState(parsed.local);

  // Sync from external value changes
  useEffect(() => {
    const p = parsePhone(value || '');
    setDdi(p.ddi);
    setLocal(p.local);
  }, [value]);

  const emitChange = (newDdi: string, newLocal: string) => {
    const cleanLocal = newLocal.replace(/\D/g, '');
    if (cleanLocal) {
      onChange(newDdi + cleanLocal);
    } else {
      onChange('');
    }
  };

  const handleDdiChange = (newDdi: string) => {
    setDdi(newDdi);
    emitChange(newDdi, local);
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setLocal(raw);
    emitChange(ddi, raw);
  };

  const displayLocal = ddi === '55' ? formatLocalBR(local) : local;

  return (
    <div className={`flex gap-2 ${className || ''}`}>
      <Select value={ddi} onValueChange={handleDdiChange}>
        <SelectTrigger className="w-[110px] shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DDI_OPTIONS.map((opt) => (
            <SelectItem key={opt.code} value={opt.code}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        value={displayLocal}
        onChange={handleLocalChange}
        placeholder={placeholder || '(00) 00000-0000'}
        className="flex-1"
      />
    </div>
  );
}

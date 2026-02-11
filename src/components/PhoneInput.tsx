import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { COUNTRIES, type CountryOption } from '@/lib/countries';
import { cn } from '@/lib/utils';

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

/** Find country by dial code from E.164 value. Prefer longest prefix match (e.g. 91 before 1). */
function parseE164(value: string): { country: CountryOption; number: string } | null {
  const digits = value.replace(/\D/g, '');
  if (!digits.length) return null;

  const sorted = [...COUNTRIES].sort((a, b) => b.phone.length - a.phone.length);
  for (const country of sorted) {
    const codeDigits = country.phone.replace(/\D/g, '');
    if (digits.startsWith(codeDigits)) {
      const number = digits.slice(codeDigits.length);
      return { country, number };
    }
  }
  return null;
}

const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.code === 'IN') ?? COUNTRIES[0];

export function PhoneInput({ value, onChange, placeholder = 'Enter phone number', id, className }: PhoneInputProps) {
  const [country, setCountry] = useState<CountryOption>(DEFAULT_COUNTRY);
  const [number, setNumber] = useState('');

  useEffect(() => {
    if (!value?.trim()) {
      setCountry(DEFAULT_COUNTRY);
      setNumber('');
      return;
    }
    if (value.startsWith('+')) {
      const parsed = parseE164(value);
      if (parsed) {
        setCountry(parsed.country);
        setNumber(parsed.number);
      }
    } else {
      setNumber(value.replace(/\D/g, ''));
    }
  }, [value]);

  const emitChange = (newCountry: CountryOption, newNumber: string) => {
    const digits = newNumber.replace(/\D/g, '');
    if (!digits) {
      onChange('');
      return;
    }
    onChange(`+${newCountry.phone.replace(/\D/g, '')}${digits}`);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const c = COUNTRIES.find((x) => x.code === code) ?? DEFAULT_COUNTRY;
    setCountry(c);
    emitChange(c, number);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const maxLen = country.phoneLength;
    const trimmed = raw.slice(0, maxLen);
    setNumber(trimmed);
    emitChange(country, trimmed);
  };

  return (
    <div
      className={cn(
        'flex h-10 w-full overflow-hidden rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all duration-200',
        className
      )}
    >
      <select
        value={country.code}
        onChange={handleCountryChange}
        className="h-full w-auto min-w-[100px] border-0 bg-transparent px-3 text-sm focus:outline-none focus:ring-0"
        aria-label="Country code"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            +{c.phone} {c.label}
          </option>
        ))}
      </select>
      <div className="h-6 w-px bg-border shrink-0 self-center" />
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        value={number}
        onChange={handleNumberChange}
        maxLength={country.phoneLength}
        className="h-full flex-1 min-w-0 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}

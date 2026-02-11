/** Country code and phone number length for validation. phoneLength is max digits for national number. */
export interface CountryOption {
  code: string;
  label: string;
  phone: string;
  phoneLength: number;
}

/** Get max length from number or array (for variable-length countries). */
export function getMaxPhoneLength(phoneLength: number | number[]): number {
  if (typeof phoneLength === 'number') return phoneLength;
  return Math.max(...phoneLength);
}

/** Curated list of countries with dial code and national number length. Popular ones first. */
export const COUNTRIES: CountryOption[] = [
  { code: 'US', label: 'United States', phone: '1', phoneLength: 10 },
  { code: 'IN', label: 'India', phone: '91', phoneLength: 10 },
  { code: 'GB', label: 'United Kingdom', phone: '44', phoneLength: 10 },
  { code: 'CA', label: 'Canada', phone: '1', phoneLength: 10 },
  { code: 'AU', label: 'Australia', phone: '61', phoneLength: 9 },
  { code: 'DE', label: 'Germany', phone: '49', phoneLength: 10 },
  { code: 'FR', label: 'France', phone: '33', phoneLength: 9 },
  { code: 'JP', label: 'Japan', phone: '81', phoneLength: 10 },
  { code: 'BR', label: 'Brazil', phone: '55', phoneLength: 11 },
  { code: 'CN', label: 'China', phone: '86', phoneLength: 11 },
  { code: 'IT', label: 'Italy', phone: '39', phoneLength: 10 },
  { code: 'ES', label: 'Spain', phone: '34', phoneLength: 9 },
  { code: 'MX', label: 'Mexico', phone: '52', phoneLength: 10 },
  { code: 'RU', label: 'Russia', phone: '7', phoneLength: 10 },
  { code: 'ZA', label: 'South Africa', phone: '27', phoneLength: 9 },
  { code: 'AE', label: 'United Arab Emirates', phone: '971', phoneLength: 9 },
  { code: 'SA', label: 'Saudi Arabia', phone: '966', phoneLength: 9 },
  { code: 'SG', label: 'Singapore', phone: '65', phoneLength: 8 },
  { code: 'MY', label: 'Malaysia', phone: '60', phoneLength: 9 },
  { code: 'PH', label: 'Philippines', phone: '63', phoneLength: 10 },
  { code: 'ID', label: 'Indonesia', phone: '62', phoneLength: 11 },
  { code: 'TH', label: 'Thailand', phone: '66', phoneLength: 9 },
  { code: 'VN', label: 'Vietnam', phone: '84', phoneLength: 9 },
  { code: 'PK', label: 'Pakistan', phone: '92', phoneLength: 10 },
  { code: 'BD', label: 'Bangladesh', phone: '880', phoneLength: 10 },
  { code: 'EG', label: 'Egypt', phone: '20', phoneLength: 10 },
  { code: 'NG', label: 'Nigeria', phone: '234', phoneLength: 10 },
  { code: 'KE', label: 'Kenya', phone: '254', phoneLength: 9 },
  { code: 'GH', label: 'Ghana', phone: '233', phoneLength: 9 },
  { code: 'ET', label: 'Ethiopia', phone: '251', phoneLength: 9 },
  { code: 'TZ', label: 'Tanzania', phone: '255', phoneLength: 9 },
  { code: 'UG', label: 'Uganda', phone: '256', phoneLength: 9 },
  { code: 'NP', label: 'Nepal', phone: '977', phoneLength: 10 },
  { code: 'LK', label: 'Sri Lanka', phone: '94', phoneLength: 9 },
  { code: 'IR', label: 'Iran', phone: '98', phoneLength: 10 },
  { code: 'TR', label: 'Turkey', phone: '90', phoneLength: 10 },
  { code: 'PL', label: 'Poland', phone: '48', phoneLength: 9 },
  { code: 'NL', label: 'Netherlands', phone: '31', phoneLength: 9 },
  { code: 'BE', label: 'Belgium', phone: '32', phoneLength: 9 },
  { code: 'CH', label: 'Switzerland', phone: '41', phoneLength: 9 },
  { code: 'AT', label: 'Austria', phone: '43', phoneLength: 10 },
  { code: 'SE', label: 'Sweden', phone: '46', phoneLength: 9 },
  { code: 'NO', label: 'Norway', phone: '47', phoneLength: 8 },
  { code: 'DK', label: 'Denmark', phone: '45', phoneLength: 8 },
  { code: 'FI', label: 'Finland', phone: '358', phoneLength: 9 },
  { code: 'IE', label: 'Ireland', phone: '353', phoneLength: 9 },
  { code: 'PT', label: 'Portugal', phone: '351', phoneLength: 9 },
  { code: 'GR', label: 'Greece', phone: '30', phoneLength: 10 },
  { code: 'RO', label: 'Romania', phone: '40', phoneLength: 10 },
  { code: 'CZ', label: 'Czech Republic', phone: '420', phoneLength: 9 },
  { code: 'HU', label: 'Hungary', phone: '36', phoneLength: 9 },
  { code: 'IL', label: 'Israel', phone: '972', phoneLength: 9 },
  { code: 'JO', label: 'Jordan', phone: '962', phoneLength: 9 },
  { code: 'KW', label: 'Kuwait', phone: '965', phoneLength: 8 },
  { code: 'QA', label: 'Qatar', phone: '974', phoneLength: 8 },
  { code: 'BH', label: 'Bahrain', phone: '973', phoneLength: 8 },
  { code: 'OM', label: 'Oman', phone: '968', phoneLength: 8 },
  { code: 'AR', label: 'Argentina', phone: '54', phoneLength: 10 },
  { code: 'CL', label: 'Chile', phone: '56', phoneLength: 9 },
  { code: 'CO', label: 'Colombia', phone: '57', phoneLength: 10 },
  { code: 'PE', label: 'Peru', phone: '51', phoneLength: 9 },
  { code: 'EC', label: 'Ecuador', phone: '593', phoneLength: 9 },
  { code: 'VE', label: 'Venezuela', phone: '58', phoneLength: 10 },
  { code: 'NZ', label: 'New Zealand', phone: '64', phoneLength: 9 },
  { code: 'KR', label: 'South Korea', phone: '82', phoneLength: 9 },
  { code: 'HK', label: 'Hong Kong', phone: '852', phoneLength: 8 },
  { code: 'TW', label: 'Taiwan', phone: '886', phoneLength: 9 },
  { code: 'UA', label: 'Ukraine', phone: '380', phoneLength: 9 },
  { code: 'KZ', label: 'Kazakhstan', phone: '7', phoneLength: 10 },
];

const DEFAULT_MASK = '***';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const parseCountryCodeLength = (digitsOnly: string): number => {
  if (digitsOnly.length < 7) return 0;
  if (!digitsOnly.startsWith('1') && digitsOnly.length >= 11) {
    const threeDigitCandidates = new Set(['212', '213', '216', '218', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246', '247', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '290', '291', '297', '298', '299', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '370', '371', '372', '373', '374', '375', '376', '377', '378', '380', '381', '382', '383', '385', '386', '387', '389', '420', '421', '423', '500', '501', '502', '503', '504', '505', '506', '507', '508', '509', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '670', '672', '673', '674', '675', '676', '677', '678', '679', '680', '681', '682', '683', '685', '686', '687', '688', '689', '690', '691', '692', '850', '852', '853', '855', '856', '870', '878', '880', '881', '882', '883', '886', '888', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '979', '992', '993', '994', '995', '996', '998']);
    const candidate3 = digitsOnly.slice(0, 3);
    if (threeDigitCandidates.has(candidate3)) return 3;
  }
  if (digitsOnly.length >= 11) {
    const twoDigitCandidates = new Set(['20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49', '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', '92', '93', '94', '95', '98']);
    const candidate2 = digitsOnly.slice(0, 2);
    if (twoDigitCandidates.has(candidate2)) return 2;
  }
  return digitsOnly.length >= 10 ? 1 : 0;
};

export const maskPhoneNumber = (number: string): string => {
  if (!number || typeof number !== 'string') return DEFAULT_MASK;

  const normalized = number.trim();
  if (!normalized) return DEFAULT_MASK;

  const digitsOnly = normalized.replace(/\D/g, '');
  if (digitsOnly.length < 5) {
    return normalized.replace(/\d(?=\d{2})/g, '•');
  }

  const hasPlusPrefix = normalized.startsWith('+');
  const countryLen = hasPlusPrefix ? parseCountryCodeLength(digitsOnly) : 0;
  const countryCode = countryLen > 0 ? digitsOnly.slice(0, countryLen) : '';
  const national = digitsOnly.slice(countryLen);

  if (national.length < 4) {
    return hasPlusPrefix && countryCode ? `+${countryCode} ${DEFAULT_MASK}` : DEFAULT_MASK;
  }

  const leadLen = clamp(national.length >= 10 ? 4 : 3, 2, Math.max(2, national.length - 2));
  const tailLen = clamp(national.length >= 11 ? 4 : 3, 2, Math.max(2, national.length - leadLen));

  const lead = national.slice(0, leadLen);
  const tail = national.slice(-tailLen);

  return `${countryCode ? `+${countryCode} ` : ''}${lead} ${DEFAULT_MASK} ${tail}`.trim();
};

export const createReportId = async (input: string): Promise<string> => {
  const value = String(input ?? '');
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 10);
};

export const formatReportDate = (date: Date): string => {
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;

  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  }).formatToParts(safeDate);

  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '';
  const dayPeriod = parts.find((part) => part.type === 'dayPeriod')?.value ?? '';
  const timeZoneName = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'UTC';

  return `${month} ${day}, ${year} at ${hour}:${minute} ${dayPeriod} ${timeZoneName}`.trim();
};

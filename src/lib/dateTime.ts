const DOMINICAN_TIME_ZONE = 'America/Santo_Domingo';

const MYSQL_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

export const parseApiDate = (value?: string | null) => {
  if (!value) return null;
  const normalized = MYSQL_TIMESTAMP_PATTERN.test(value)
    ? value.replace(' ', 'T') + 'Z'
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDominicanDateTime = (value?: string | null, options?: Intl.DateTimeFormatOptions) => {
  const date = parseApiDate(value);
  if (!date) return value ? 'Fecha inválida' : 'Sin actividad';
  return new Intl.DateTimeFormat('es-DO', {
    timeZone: DOMINICAN_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'medium',
    ...options,
  }).format(date);
};

export const dominicanDayKey = (value?: string | null) => {
  const date = parseApiDate(value);
  if (!date) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DOMINICAN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || '';
  return [part('year'), part('month'), part('day')].filter(Boolean).join('-');
};

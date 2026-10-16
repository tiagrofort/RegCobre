/**
 * Utilitários robustos de tratamento, conversão e comparação de datas
 * Suporta formatos ISO (YYYY-MM-DD) e Brasileiro (DD/MM/YYYY)
 */

export function parseDateString(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const clean = String(dateStr).trim();
  if (!clean) return null;

  // Formato ISO: YYYY-MM-DD (e.g. de inputs type="date")
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const [y, m, d] = clean.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  // Formato Brasileiro: DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}/.test(clean)) {
    const [d, m, y] = clean.split(' ')[0].split('/').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  const parsed = new Date(clean);
  if (isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
}

export function formatDateBR(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? parseDateString(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput : '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateISO(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? parseDateString(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput : '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameDay(dateA?: string | Date | null, dateB?: string | Date | null): boolean {
  const da = typeof dateA === 'string' ? parseDateString(dateA) : dateA;
  const db = typeof dateB === 'string' ? parseDateString(dateB) : dateB;
  if (!da || !db) return false;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function isWithinNextDays(
  targetDate?: string | Date | null,
  baseDate?: string | Date | null,
  days: number = 7
): boolean {
  const dt = typeof targetDate === 'string' ? parseDateString(targetDate) : targetDate;
  const db = typeof baseDate === 'string' ? parseDateString(baseDate) : baseDate;
  if (!dt || !db) return false;

  const start = new Date(db.getFullYear(), db.getMonth(), db.getDate(), 0, 0, 0, 0).getTime();
  const end = new Date(db.getFullYear(), db.getMonth(), db.getDate() + days, 23, 59, 59, 999).getTime();
  const target = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12, 0, 0, 0).getTime();

  return target >= start && target <= end;
}

export function getShortMonthName(monthIndex: number): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[monthIndex] || '';
}

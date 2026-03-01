import { eachDayOfInterval, startOfMonth, endOfMonth, isWeekend } from 'date-fns';

export function countBusinessDays(year, month) {
  const start = startOfMonth(new Date(year, month, 1));
  const end = endOfMonth(new Date(year, month, 1));
  return eachDayOfInterval({ start, end }).filter(d => !isWeekend(d)).length;
}

export function calculateBillableHours(year, month, hoursPerDay = 8) {
  const businessDays = countBusinessDays(year, month);
  return { businessDays, hours: businessDays * hoursPerDay };
}

import { parseISO, addDays, format, isAfter } from 'date-fns';

export function buildGrid(period: { startDate: string; endDate: string; }, events: { userId: any; date: any; endDate: any; }[], siteData: { users: any[]; }) {
  const periodStart = parseISO(period.startDate);
  const periodEnd = parseISO(period.endDate); // inclusive

  // 1️⃣ Build lookup of all user/date combos
  const hasEvent = new Set();
  for (const ev of events) {
    let d = parseISO(ev.date);
    const end = parseISO(ev.endDate);

    // Inclusive range: stop when d > end
    while (!isAfter(d, end)) {
      hasEvent.add(`${ev.userId}|${format(d, 'yyyy-MM-dd')}`);
      d = addDays(d, 1);
    }
  }

  // 2️⃣ Generate all days in [periodStart, periodEnd]
  const days = [];
  for (let d = periodStart; !isAfter(d, periodEnd); d = addDays(d, 1)) {
    days.push(format(d, 'yyyy-MM-dd'));
  }

  // 3️⃣ Build rows for grid
  const userIds = siteData.users.map(u => u.id);
  const rows = days.map(dateStr => {
    const row: { date: string; [key: string]: string | number } = { date: dateStr };
    let total = 0;

    for (const uid of userIds) {
      const marked = hasEvent.has(`${uid}|${dateStr}`);
      row[uid] = marked ? 'X' : '';
      if (marked) total += 1;
    }
    row.total = total;
    return row;
  });

  return rows;
}

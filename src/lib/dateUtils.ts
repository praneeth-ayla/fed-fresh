// Format a single date like "Nov 12"
export const formatSingleDate = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Format a list of dates like ["Nov 10", "Nov 12", "Dec 1"]
export const formatSingleDates = (dates: string[]): string[] => {
  return dates
    .map((date) => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime())
    .map((d) => formatSingleDate(d));
};

// Format a weekly range like "Nov 10 - Nov 14"
export const formatWeeklyRange = (weekStart: string): string => {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 4); // Monday–Friday

  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${startStr} - ${endStr}`;
};

import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateLabel = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
};

export const getDaysDiff = (date: Date) => {
  const today = new Date();
  const start = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const diffMs = target.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return { diff: Math.abs(days), state: "past" as const };
  if (days > 0) return { diff: days, state: "future" as const };
  return { diff: 0, state: "today" as const };
};

export const cleanGeo = (value?: string | null) => {
  if (!value) return "";
  const pattern = /^.*?(-?\d+)(?:\.\d+)?[,，\s]+(-?\d+)(?:\.\d+)?\s*(.*)$/;
  const match = pattern.exec(value.trim());
  if (match) {
    const latInt = match[1];
    const lngInt = match[2];
    const rest = match[3];
    const coordPart = `${latInt} ${lngInt}`;
    return rest ? `${coordPart} ${rest}` : coordPart;
  }
  return value;
};

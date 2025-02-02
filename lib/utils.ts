import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: (string | undefined)[]) {
  return inputs.filter(Boolean).join(" ")
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Replace accented characters with their basic equivalents
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Remove all non-alphanumeric characters except spaces and hyphens
      .replace(/[^a-z0-9\s-]/g, "")
      // Replace multiple spaces/hyphens with single hyphen
      .replace(/[\s-]+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
  );
}

export function toDomain(email: string): string {
  return email.split("@")[1];
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

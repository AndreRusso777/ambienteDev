import { THREE_HOURS_IN_MS } from "@/constants/time";

/**
 * 
 * @param dateString 
 * @returns Valid UTC-3 Date Object
 */
export const getUTC3Date = (dateString: string | null = null): Date => {
  const date = dateString ? new Date(dateString) : new Date();

  /**
   * Validate if the date is valid,
   * fallback to current date if invalid
   */ 
  if (isNaN(date.getTime())) {
    return new Date(new Date().getTime() - THREE_HOURS_IN_MS);
  }

  /** Return the UTC-3 adjusted date */ 
  return new Date(date.getTime() - THREE_HOURS_IN_MS);
}
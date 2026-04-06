export const SITE_NAME = "Mission Beach Billboard TV";
export const SITE_DESCRIPTION =
  "Digital signage platform for Mission Beach — manage and display ads on billboard TVs";

export const AD_DURATIONS = [15, 30, 60] as const; // seconds
export type AdDuration = (typeof AD_DURATIONS)[number];

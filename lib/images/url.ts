/** Browser URL for a stored photo key (served behind the login by /api/images). */
export function imageSrc(key: string | null | undefined): string | null {
  return key ? `/api/images/${key}` : null;
}

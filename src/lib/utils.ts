type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, unknown>

function clsx(...inputs: ClassValue[]): string {
  return inputs
    .flat(Infinity as 10)
    .filter(Boolean)
    .join(' ')
}

export function cn(...inputs: ClassValue[]): string {
  return clsx(...inputs)
}

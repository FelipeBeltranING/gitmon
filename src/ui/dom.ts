export function $<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Falta el elemento ${selector}`);
  return el;
}

export const $$ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] => [
  ...root.querySelectorAll<T>(selector),
];

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

export const fmt = (n: number): string => n.toLocaleString('es-CO', { maximumFractionDigits: 1 });
export const pad = (n: number): string => String(n).padStart(4, '0');

export const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export const prefersReducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

import { z } from 'zod';
const text = z.string().max(500).regex(/^[^<>`'&]*$/u, 'Usa texto sin símbolos HTML ni comillas simples.');
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const number = z.number().int().min(0).max(10000000);
export const productSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), name: text.min(1),
  series: z.enum(['xr-11','12','13','14','15','16']), seriesLabel: text,
  condition: text, batteryHealth: text, simInfo: text, extraNote: text.optional(),
  cameraType: z.enum(['single','dual-vertical','dual-diagonal','triple-pro']),
  chip: text, display: text, camera: text, stock: number, basePrice: number,
  defaultStorageIndex: z.number().int().min(0).optional(),
  storages: z.array(z.object({size: text.min(1), extra: number, locked: z.boolean().optional()})).min(1).max(20),
  colors: z.array(z.object({name: text.min(1), hex: color, frame: color, locked: z.boolean().optional()})).min(1).max(30),
}).refine(p => (p.defaultStorageIndex || 0) < p.storages.length, 'Capacidad principal inválida');
export const catalogSchema = z.array(productSchema).max(200).refine(items => new Set(items.map(p => p.id)).size === items.length, 'Hay equipos duplicados.');
export const saveSchema = z.object({products: catalogSchema, revision: z.number().int().nonnegative()});
export const OWNER_EMAIL = 'andryfigueroa007@gmail.com';
export function isOwner(user) { return !!user?.confirmed_at && user.email?.toLowerCase() === OWNER_EMAIL; }

import { drizzle } from 'drizzle-orm/netlify-db';
import { eq, and, sql } from 'drizzle-orm';
import { catalogState } from '../../db/schema.ts';
import { saveSchema, isOwner } from './validation.mjs';
const db = drizzle();
const json = (body, status = 200) => Response.json(body, {status, headers: {'Cache-Control': 'no-store'}});
async function owner(request) {
  const cookie = request.headers.get('cookie') || '';
  const token = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('nf_jwt='))?.slice(7);
  if (!token) return false;
  try {
    const response = await fetch('https://brothersiphone.netlify.app/.netlify/identity/user', {
      headers: {Authorization: `Bearer ${decodeURIComponent(token)}`}, signal: AbortSignal.timeout(8000),
    });
    return response.ok && isOwner(await response.json());
  } catch { return false; }
}
export default async function(request) {
  const path = new URL(request.url).pathname;
  if (path !== '/api/catalog' && path !== '/api/admin') return json({error: 'No encontrado'}, 404);
  try {
    if (path === '/api/admin') return json({authorized: await owner(request)});
    if (request.method === 'GET') {
      const [row] = await db.select().from(catalogState).where(eq(catalogState.id, 'main'));
      return json(row ? {products: row.products, revision: row.revision} : {products: null, revision: 0});
    }
    if (request.method !== 'PUT') return json({error: 'Método no permitido'}, 405);
    if (request.headers.get('origin') !== new URL(request.url).origin) return json({error: 'Origen no permitido'}, 403);
    if (!await owner(request)) return json({error: 'Inicia sesión con el correo del propietario.'}, 403);
    const body = await request.text();
    if (body.length > 1000000) return json({error: 'Catálogo demasiado grande'}, 413);
    let data;
    try { data = saveSchema.parse(JSON.parse(body)); }
    catch { return json({error: 'Revisa los campos: precios y unidades deben ser enteros positivos o cero; usa texto sin comillas simples ni símbolos HTML.'}, 400); }
    let saved;
    if (data.revision === 0) {
      [saved] = await db.insert(catalogState).values({id:'main', products:data.products, revision:1}).onConflictDoNothing().returning();
    } else {
      [saved] = await db.update(catalogState).set({products:data.products, revision:sql`${catalogState.revision} + 1`}).where(and(eq(catalogState.id,'main'),eq(catalogState.revision,data.revision))).returning();
    }
    if (!saved) return json({error:'El catálogo cambió desde otro dispositivo. Recarga la página antes de editar.'},409);
    return json({revision:saved.revision});
  } catch { return json({error:'No se pudo conectar con el catálogo. Inténtalo de nuevo.'},503); }
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { catalogSchema, saveSchema, isOwner } from '../netlify/server/validation.mjs';
const html=readFileSync('index.html','utf8');
const source=html.slice(html.indexOf('const initialCatalog = ['),html.indexOf('// Cargar inventario guardado'));
const products=vm.runInNewContext(source+'; initialCatalog');
test('el catálogo existente se puede guardar completo',()=>assert.equal(catalogSchema.parse(products).length,products.length));
test('permite cambiar precio y marcar agotado',()=>{ const copy=structuredClone(products);copy[0].basePrice=23400;copy[0].stock=0; assert.equal(saveSchema.parse({products:copy,revision:0}).products[0].stock,0); });
test('rechaza precios negativos, HTML, identificadores inyectados y capacidad inválida',()=>{
 for(const change of [{basePrice:-1},{stock:-1},{name:'<img onerror=alert(1)>'},{id:"x');alert(1)//"},{defaultStorageIndex:999}]) {
 assert.equal(catalogSchema.safeParse([{...products[0],...change}]).success,false);
 }
});
test('solo permite al propietario con correo confirmado',()=>{
 assert.equal(isOwner({email:'andryfigueroa007@gmail.com'}),false);
 assert.equal(isOwner({email:'otro@example.com',confirmed_at:'2026-01-01'}),false);
 assert.equal(isOwner({email:'andryfigueroa007@gmail.com',confirmed_at:'2026-01-01'}),true);
});
test('todos los scripts clásicos tienen sintaxis válida',()=>{
 for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
 if(!/application\/json|type="module"/.test(match[1])) new vm.Script(match[2]);
 }
});

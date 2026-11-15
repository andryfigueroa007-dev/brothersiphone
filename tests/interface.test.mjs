import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
test('el propietario edita y guarda; clientes consultan sin descontar inventario', async () => {
 const window=new Window({url:'https://brothersiphone.netlify.app',settings:{disableJavaScriptFileLoading:true,disableCSSFileLoading:true,disableJavaScriptEvaluation:true}});
 const html=readFileSync('public/index.html','utf8');
 window.document.write(html);
 window.tailwind={}; window.structuredClone=structuredClone;
 let stored=null;let revision=0;
 window.fetch=async (path, options={})=>({ok:true,json:async()=> {
  if(path==='/api/admin') return {authorized:true};
  if(options.method==='PUT'){stored=JSON.parse(options.body).products;return {revision:++revision};}
  return {products:null,revision};
 }});
 let scripts='';
 for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if(!/application\/json|type="module"|src=/.test(match[1])) scripts+=match[2]+'\n';
 }
 Object.defineProperty(window.document,'readyState',{value:'loading',configurable:true});
 window.eval(scripts);
 window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
 await new Promise(resolve=>setTimeout(resolve,50));
 assert.ok(window.document.querySelectorAll('.iphone-card').length>0);
 assert.equal(window.document.getElementById('toggle-admin-btn').classList.contains('hidden'),false);
 await window.toggleAdminMode();
 assert.equal(window.document.getElementById('admin-tools').classList.contains('hidden'),false);
 const id=window.document.querySelector('.iphone-card button[onclick^="openEditor"]').getAttribute('onclick').match(/'([^']+)'/)[1];
 window.openEditor(id);
 window.document.querySelector('[data-f="stock"]').value='0';
 window.document.querySelector('[data-f="basePrice"]').value='23100';
 window.document.querySelector('[data-f="extraNote"]').value='Equipo revisado';
 window.saveEditor();
 await new Promise(resolve=>setTimeout(resolve,30));
 assert.equal(stored.find(p=>p.id===id).stock,0);
 assert.equal(stored.find(p=>p.id===id).basePrice,23100);
 assert.ok(window.document.getElementById('catalog-save-status').textContent.includes('Cambios guardados'));
 await window.happyDOM.abort();
});

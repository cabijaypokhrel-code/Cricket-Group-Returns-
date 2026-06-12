/* ══════════════════════════════════════════════════════════════════════
   utils.js — Shared utility helpers
   ══════════════════════════════════════════════════════════════════════ */

function escapeHtml(str){
  if(str==null) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function safeJsonParse(str, fallback){
  if(fallback===undefined) fallback=null;
  try{ var v=JSON.parse(str); return v!==undefined?v:fallback; }
  catch(e){ return fallback; }
}

function safeJsonStringify(val){
  try{ return JSON.stringify(val); } catch(e){ return null; }
}

function safeLocalGet(key, fallback){
  if(fallback===undefined) fallback=null;
  try{ var raw=localStorage.getItem(key); return raw!==null?safeJsonParse(raw,fallback):fallback; }
  catch(e){ return fallback; }
}

function safeLocalSet(key, val){
  try{ var s=safeJsonStringify(val); if(s!==null) localStorage.setItem(key,s); return true; }
  catch(e){ return false; }
}

function safeLocalRemove(key){
  try{ localStorage.removeItem(key); return true; } catch(e){ return false; }
}

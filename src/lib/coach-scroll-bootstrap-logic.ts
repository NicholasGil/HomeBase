import { coachScrollStorageKey } from "@/lib/coach-scroll-key";
import { COACH_SCROLL_RESTORATION_ORIGINAL_KEY } from "@/lib/coach-scroll-restoration-window";

export function isCoachScrollPath(pathname: string): boolean {
  return /^\/coach(\/|$)/.test(pathname);
}

export function readCoachScrollYFromStorage(
  storage: Pick<Storage, "getItem">,
  pathname: string,
): number | null {
  try {
    const raw = storage.getItem(coachScrollStorageKey(pathname));
    if (raw === null) {
      return null;
    }
    const y = Number.parseInt(raw, 10);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

export function clampCoachScrollTarget(
  y: number,
  scrollHeight: number,
  innerHeight: number,
): number {
  const max = Math.max(0, scrollHeight - innerHeight);
  return Math.min(y, max);
}

export function restoreCoachScrollY(options: {
  pathname: string;
  storage: Pick<Storage, "getItem">;
  scrollTo: (x: number, y: number) => void;
  scrollHeight: number;
  innerHeight: number;
}): boolean {
  if (!isCoachScrollPath(options.pathname)) {
    return false;
  }
  const y = readCoachScrollYFromStorage(options.storage, options.pathname);
  if (y === null || y <= 0) {
    return false;
  }
  const target = clampCoachScrollTarget(
    y,
    options.scrollHeight,
    options.innerHeight,
  );
  options.scrollTo(0, target);
  return true;
}

/** Inline script: pathname-keyed save on pointerdown/pagehide; restore on popstate/pageshow. */
export function coachScrollBootstrapScriptBody(keyPrefix: string): string {
  const origKey = COACH_SCROLL_RESTORATION_ORIGINAL_KEY;
  return `
function onCoach(){return/^\\/coach(\\/|$)/.test(location.pathname);}
function scrollKey(){return ${JSON.stringify(keyPrefix)}+':'+location.pathname;}
var lastCoachY=0;
function rememberY(){if(!onCoach())return;if(window.scrollY>0)lastCoachY=window.scrollY;}
function readY(){try{var raw=sessionStorage.getItem(scrollKey());if(raw===null)return null;var y=parseInt(raw,10);return isFinite(y)?y:null;}catch(e){return null;}}
function saveY(){if(!onCoach())return;rememberY();var y=Math.max(window.scrollY,lastCoachY);if(y<=0){var existing=readY();if(existing!==null&&existing>0)return;}try{sessionStorage.setItem(scrollKey(),String(Math.max(0,Math.round(y))));}catch(e){}}
window.addEventListener('scroll',rememberY,{passive:true});
var programmaticScroll=false;
function restore(){if(!onCoach())return;var y=readY();if(y===null||y<=0)return;var max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);var t=Math.min(y,max);programmaticScroll=true;window.scrollTo(0,t);requestAnimationFrame(function(){requestAnimationFrame(function(){programmaticScroll=false;});});}
function scheduleRestore(){restore();setTimeout(restore,0);setTimeout(restore,80);}
function shouldSaveForLink(a){if(!a)return false;var href=a.getAttribute('href');if(!href||href.charAt(0)!=='/')return false;if(href.indexOf('/transactions/')===0)return true;if(href.indexOf('/pricing')===0)return true;if(a.closest('[data-testid="app-tab-bar"]'))return true;return false;}
function resetScrollRestoration(){try{history.scrollRestoration='auto';}catch(e){}}
if(onCoach()){try{if(typeof window[${JSON.stringify(origKey)}]==='undefined'){window[${JSON.stringify(origKey)}]=history.scrollRestoration;}history.scrollRestoration='manual';}catch(e){}}
scheduleRestore();
function onLeavingClick(e){if(!onCoach())return;var t=e.target;if(!(t instanceof Element))return;var a=t.closest('a[href]');if(shouldSaveForLink(a))saveY();}
document.addEventListener('pointerdown',onLeavingClick,true);
document.addEventListener('mousedown',onLeavingClick,true);
document.addEventListener('click',onLeavingClick,true);
window.addEventListener('pagehide',function(){if(onCoach())saveY();resetScrollRestoration();});
window.addEventListener('pageshow',function(){scheduleRestore();});
window.addEventListener('popstate',function(){scheduleRestore();});
`.trim();
}

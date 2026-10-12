import {
  COACH_SCROLL_PERSONA_DATA_ATTR,
  coachScrollStorageKey,
} from "@/lib/coach-scroll-key";
import { COACH_SCROLL_RESTORATION_ORIGINAL_KEY } from "@/lib/coach-scroll-restoration-window";

export function isCoachScrollPath(pathname: string): boolean {
  return /^\/coach(\/|$)/.test(pathname);
}

export function readCoachScrollYFromStorage(
  storage: Pick<Storage, "getItem">,
  pathname: string,
  personaKey = "guest",
): number | null {
  try {
    const raw = storage.getItem(coachScrollStorageKey(pathname, personaKey));
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
  personaKey?: string;
  storage: Pick<Storage, "getItem">;
  scrollTo: (x: number, y: number) => void;
  scrollHeight: number;
  innerHeight: number;
}): boolean {
  if (!isCoachScrollPath(options.pathname)) {
    return false;
  }
  const y = readCoachScrollYFromStorage(
    options.storage,
    options.pathname,
    options.personaKey ?? "guest",
  );
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

/** Inline script: persona+pathname scroll save; restore on popstate/pageshow. */
export function coachScrollBootstrapScriptBody(keyPrefix: string): string {
  const personaAttr = COACH_SCROLL_PERSONA_DATA_ATTR;
  const origKey = COACH_SCROLL_RESTORATION_ORIGINAL_KEY;
  return `
function onCoach(){return/^\\/coach(\\/|$)/.test(location.pathname);}
function personaKey(){var v=document.documentElement.getAttribute(${JSON.stringify(personaAttr)});return v&&v.length>0?v:'guest';}
function scrollKey(){return ${JSON.stringify(keyPrefix)}+':'+personaKey()+':'+location.pathname;}
var lastCoachY=0;
function rememberY(){if(!onCoach())return;if(window.scrollY>0)lastCoachY=window.scrollY;}
function readY(){try{var raw=sessionStorage.getItem(scrollKey());if(raw===null)return null;var y=parseInt(raw,10);return isFinite(y)?y:null;}catch(e){return null;}}
function saveY(){if(!onCoach())return;rememberY();var y=window.scrollY>0?Math.max(window.scrollY,lastCoachY):lastCoachY;try{sessionStorage.setItem(scrollKey(),String(Math.max(0,Math.round(y))));}catch(e){}}
var userScrolled=false;
function markUserScroll(){userScrolled=true;}
window.addEventListener('wheel',markUserScroll,{passive:true});
window.addEventListener('touchmove',markUserScroll,{passive:true});
window.addEventListener('keydown',markUserScroll);
window.addEventListener('scroll',function(){if(!onCoach())return;if(window.scrollY>0){rememberY();try{sessionStorage.setItem(scrollKey(),String(Math.max(0,Math.round(lastCoachY))));}catch(e){}return;}if(userScrolled&&lastCoachY>0){userScrolled=false;lastCoachY=0;try{sessionStorage.setItem(scrollKey(),'0');}catch(e){}}},{passive:true});
function restore(){if(!onCoach())return;var y=readY();if(y===null||y<=0)return;var max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);var t=Math.min(y,max);window.scrollTo(0,t);}
function shouldSaveForLink(a){if(!a)return false;var href=a.getAttribute('href');if(!href||href.charAt(0)!=='/')return false;if(href.indexOf('/transactions/')===0)return true;if(href.indexOf('/pricing')===0)return true;if(a.closest('[data-testid="app-tab-bar"]'))return true;return false;}
function resetScrollRestoration(){try{history.scrollRestoration='auto';}catch(e){}}
if(onCoach()){try{if(typeof window[${JSON.stringify(origKey)}]==='undefined'){window[${JSON.stringify(origKey)}]=history.scrollRestoration;}history.scrollRestoration='manual';}catch(e){}}
restore();
function onLeavingClick(e){if(!onCoach())return;var t=e.target;if(!(t instanceof Element))return;var a=t.closest('a[href]');if(shouldSaveForLink(a))saveY();}
document.addEventListener('pointerdown',onLeavingClick,true);
document.addEventListener('mousedown',onLeavingClick,true);
document.addEventListener('click',onLeavingClick,true);
window.addEventListener('pagehide',function(){if(onCoach())saveY();resetScrollRestoration();});
window.addEventListener('pageshow',function(){restore();});
window.addEventListener('popstate',function(){restore();});
`.trim();
}

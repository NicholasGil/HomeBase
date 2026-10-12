import {
  COACH_SCROLL_ENTER_STARTED_KEY,
  COACH_SCROLL_EPOCH_COOKIE,
  COACH_SCROLL_EPOCH_SESSION_KEY,
} from "@/lib/coach-scroll-epoch";
import { coachScrollStorageKeyForEpoch } from "@/lib/coach-scroll-key";
import { COACH_SCROLL_RESTORATION_ORIGINAL_KEY } from "@/lib/coach-scroll-restoration-window";
import { DEMO_COACH_SCROLL_RESET_COOKIE } from "@/lib/demo-coach-scroll-reset";

export function isCoachScrollPath(pathname: string): boolean {
  return /^\/coach(\/|$)/.test(pathname);
}

export function readCoachScrollYFromStorage(
  storage: Pick<Storage, "getItem">,
  pathname: string,
  epoch: string,
): number | null {
  const storageKey = coachScrollStorageKeyForEpoch(pathname, epoch);
  try {
    const raw = storage.getItem(storageKey);
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
  epoch?: string;
  storage: Pick<Storage, "getItem">;
  scrollTo: (x: number, y: number) => void;
  scrollHeight: number;
  innerHeight: number;
}): boolean {
  if (!isCoachScrollPath(options.pathname)) {
    return false;
  }
  const epoch = options.epoch ?? "0";
  const y = readCoachScrollYFromStorage(
    options.storage,
    options.pathname,
    epoch,
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

/** Inline script: epoch-scoped save/restore; popstate/pageshow for bfcache. */
export function coachScrollBootstrapScriptBody(keyPrefix: string): string {
  const origKey = COACH_SCROLL_RESTORATION_ORIGINAL_KEY;
  const resetCookie = DEMO_COACH_SCROLL_RESET_COOKIE;
  const epochCookie = COACH_SCROLL_EPOCH_COOKIE;
  const epochSessionKey = COACH_SCROLL_EPOCH_SESSION_KEY;
  const enterStartedKey = COACH_SCROLL_ENTER_STARTED_KEY;
  return `
function onCoach(){return/^\\/coach(\\/|$)/.test(location.pathname);}
function readEpochCookie(){try{var parts=document.cookie.split(';');for(var i=0;i<parts.length;i++){var p=parts[i].trim();if(p.indexOf(${JSON.stringify(epochCookie)}+'=')===0){var v=p.slice(${JSON.stringify(epochCookie)}.length+1);return v&&v.length?v:'0';}}return '0';}catch(e){return '0';}}
function syncEpochFromCookie(){var prev='0';try{prev=sessionStorage.getItem(${JSON.stringify(epochSessionKey)})||'0';}catch(e){}var e=readEpochCookie();var changed=e!==prev;try{sessionStorage.setItem(${JSON.stringify(epochSessionKey)},e);sessionStorage.removeItem(${JSON.stringify(enterStartedKey)});}catch(err){}return {epoch:e,changed:changed};}
function afterCoachNavigationRestore(){if(enterSaveBlocked())return;var ep=syncEpochFromCookie();var reset=applyDemoCoachScrollReset();if(reset||ep.changed){lastCoachY=0;try{sessionStorage.setItem(scrollKey(),'0');}catch(e){}window.scrollTo(0,0);return;}restore();}
var coachScrollReady=false;
function enterSaveBlocked(){try{return sessionStorage.getItem(${JSON.stringify(enterStartedKey)})==='1';}catch(e){return false;}}
function markEnterStarted(){try{sessionStorage.setItem(${JSON.stringify(enterStartedKey)},'1');}catch(e){}}
function pathNorm(h){var q=h.split('?')[0].split('#')[0];return q.length>1&&q.charAt(q.length-1)==='/'?q.slice(0,-1):q;}
function hrefDemoEnter(href){if(!href||href.charAt(0)!=='/')return false;var path=pathNorm(href.split('?')[0].split('#')[0]);return path==='/demo'||path.indexOf('/demo/enter')===0;}
function scrollKey(){var epoch=syncEpochFromCookie().epoch;return ${JSON.stringify(keyPrefix)}+':'+epoch+':'+location.pathname;}
var lastCoachY=0;
var blockZeroSaveUntil=0;
var leavingCoach=false;
function rememberY(){if(!onCoach())return;if(window.scrollY>0)lastCoachY=window.scrollY;}
function readY(){try{var raw=sessionStorage.getItem(scrollKey());if(raw===null)return null;var y=parseInt(raw,10);return isFinite(y)?y:null;}catch(e){return null;}}
function saveY(){if(!onCoach())return;if(enterSaveBlocked())return;rememberY();var y=window.scrollY>0?Math.max(window.scrollY,lastCoachY):lastCoachY;try{sessionStorage.setItem(scrollKey(),String(Math.max(0,Math.round(y))));}catch(e){}}
var userScrolled=false;
function markUserScroll(){userScrolled=true;}
window.addEventListener('wheel',markUserScroll,{passive:true});
window.addEventListener('touchmove',markUserScroll,{passive:true});
window.addEventListener('keydown',markUserScroll);
window.addEventListener('scroll',function(){if(!coachScrollReady||!onCoach())return;if(enterSaveBlocked())return;if(window.scrollY>0){leavingCoach=false;rememberY();try{sessionStorage.setItem(scrollKey(),String(Math.max(0,Math.round(lastCoachY))));}catch(e){}return;}if(leavingCoach||Date.now()<blockZeroSaveUntil)return;var prev=readY();if(prev!==null&&prev>0&&!userScrolled)return;if(userScrolled&&lastCoachY>0){userScrolled=false;}lastCoachY=0;try{sessionStorage.setItem(scrollKey(),'0');}catch(e){}},{passive:true});
function restore(){if(!onCoach())return;if(enterSaveBlocked())return;syncEpochFromCookie();var y=readY();if(y===null||y<=0){if(window.scrollY>10){window.scrollTo(0,0);}return;}var max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);var t=Math.min(y,max);blockZeroSaveUntil=Date.now()+500;lastCoachY=t;window.scrollTo(0,t);}
function applyDemoCoachScrollReset(){try{var needs=document.cookie.split(';').some(function(p){return p.trim().indexOf(${JSON.stringify(resetCookie)}+'=')===0;});if(!needs)return false;document.cookie=${JSON.stringify(resetCookie)}+'=; Max-Age=0; path=/';try{sessionStorage.setItem(scrollKey(),'0');}catch(e){}lastCoachY=0;return true;}catch(e){return false;}}
function navLeaves(href){if(!href||href.charAt(0)!=='/')return false;return pathNorm(href)!==pathNorm(location.pathname);}
function shouldSaveForLink(a){if(!a)return false;var href=a.getAttribute('href');if(!href||href.charAt(0)!=='/')return false;if(!navLeaves(href))return false;if(href.indexOf('/transactions/')===0)return true;if(href.indexOf('/pricing')===0)return true;if(a.closest('[data-testid="app-tab-bar"]'))return true;return false;}
function resetScrollRestoration(){try{history.scrollRestoration='auto';}catch(e){}}
function onDemoEnterPointer(e){var t=e.target;if(!(t instanceof Element))return;var a=t.closest('a[href]');if(!a)return;var href=a.getAttribute('href');if(hrefDemoEnter(href)){markEnterStarted();}}
document.addEventListener('pointerdown',onDemoEnterPointer,true);
document.addEventListener('mousedown',onDemoEnterPointer,true);
if(onCoach()){try{if(typeof window[${JSON.stringify(origKey)}]==='undefined'){window[${JSON.stringify(origKey)}]=history.scrollRestoration;}history.scrollRestoration='manual';}catch(e){}afterCoachNavigationRestore();coachScrollReady=true;}
function onLeavingClick(e){if(!onCoach())return;if(enterSaveBlocked())return;var t=e.target;if(!(t instanceof Element))return;var a=t.closest('a[href]');if(!shouldSaveForLink(a))return;var href=a.getAttribute('href');if(hrefDemoEnter(href)){markEnterStarted();return;}saveY();leavingCoach=true;}
document.addEventListener('pointercancel',function(){leavingCoach=false;},true);
document.addEventListener('pointerdown',onLeavingClick,true);
document.addEventListener('mousedown',onLeavingClick,true);
document.addEventListener('click',onLeavingClick,true);
window.addEventListener('pagehide',function(){leavingCoach=false;resetScrollRestoration();});
window.addEventListener('pageshow',function(e){if(!onCoach()){resetScrollRestoration();return;}if(e.persisted){afterCoachNavigationRestore();}});
window.addEventListener('popstate',function(){if(!onCoach()){resetScrollRestoration();return;}afterCoachNavigationRestore();});
`.trim();
}

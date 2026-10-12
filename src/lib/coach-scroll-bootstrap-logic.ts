import { coachScrollStorageKeyForEpoch } from "@/lib/coach-scroll-key";
import {
  COACH_SCROLL_ENTER_STARTED_KEY,
  COACH_SCROLL_EPOCH_COOKIE,
  COACH_SCROLL_EPOCH_SESSION_KEY,
} from "@/lib/coach-scroll-epoch";
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
  storage: Pick<Storage, "getItem">;
  scrollTo: (x: number, y: number) => void;
  scrollHeight: number;
  innerHeight: number;
  epoch?: string;
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

/**
 * Inline script: sync scroll epoch + block demo-enter races before first paint on /coach.
 * Ongoing save/restore lives in CoachScrollRestoration (client) so other routes keep native scroll.
 */
export function coachScrollBootstrapScriptBody(keyPrefix: string): string {
  const origKey = COACH_SCROLL_RESTORATION_ORIGINAL_KEY;
  const resetCookie = DEMO_COACH_SCROLL_RESET_COOKIE;
  const epochCookie = COACH_SCROLL_EPOCH_COOKIE;
  const epochSessionKey = COACH_SCROLL_EPOCH_SESSION_KEY;
  const enterStartedKey = COACH_SCROLL_ENTER_STARTED_KEY;
  return `
function onCoach(){return/^\\/coach(\\/|$)/.test(location.pathname);}
function readEpochCookie(){try{var parts=document.cookie.split(';');for(var i=0;i<parts.length;i++){var p=parts[i].trim();if(p.indexOf(${JSON.stringify(epochCookie)}+'=')===0){var v=p.slice(${JSON.stringify(epochCookie)}.length+1);return v&&v.length?v:'0';}}return '0';}catch(e){return '0';}}
function syncEpochFromCookie(){var e=readEpochCookie();try{sessionStorage.setItem(${JSON.stringify(epochSessionKey)},e);sessionStorage.removeItem(${JSON.stringify(enterStartedKey)});}catch(err){}return e;}
function markEnterStarted(){try{sessionStorage.setItem(${JSON.stringify(enterStartedKey)},'1');}catch(e){}}
function pathNorm(h){var q=h.split('?')[0].split('#')[0];return q.length>1&&q.charAt(q.length-1)==='/'?q.slice(0,-1):q;}
function hrefDemoEnter(href){if(!href||href.charAt(0)!=='/')return false;var path=pathNorm(href.split('?')[0].split('#')[0]);return path==='/demo'||path.indexOf('/demo/enter')===0;}
function onDemoEnterPointer(e){var t=e.target;if(!(t instanceof Element))return;var a=t.closest('a[href]');if(!a)return;var href=a.getAttribute('href');if(hrefDemoEnter(href)){markEnterStarted();}}
syncEpochFromCookie();
document.addEventListener('pointerdown',onDemoEnterPointer,true);
document.addEventListener('mousedown',onDemoEnterPointer,true);
function coachHomeKey(){var epoch=syncEpochFromCookie();return ${JSON.stringify(keyPrefix)}+':'+epoch+':/coach';}
function readY(){try{var raw=sessionStorage.getItem(coachHomeKey());if(raw===null)return null;var y=parseInt(raw,10);return isFinite(y)?y:null;}catch(e){return null;}}
function applyDemoCoachScrollReset(){syncEpochFromCookie();try{var needs=document.cookie.split(';').some(function(p){return p.trim().indexOf(${JSON.stringify(resetCookie)}+'=')===0;});if(!needs)return false;document.cookie=${JSON.stringify(resetCookie)}+'=; Max-Age=0; path=/';window.scrollTo(0,0);return true;}catch(e){return false;}}
if(onCoach()){try{if(typeof window[${JSON.stringify(origKey)}]==='undefined'){window[${JSON.stringify(origKey)}]=history.scrollRestoration;}history.scrollRestoration='manual';}catch(e){}if(applyDemoCoachScrollReset()){}else{var y=readY();if(y!==null&&y>0){var max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);window.scrollTo(0,Math.min(y,max));}}}
`.trim();
}

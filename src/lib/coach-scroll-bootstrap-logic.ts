import { COACH_SCROLL_STORAGE_KEY } from "@/lib/coach-scroll-key";
import { readCoachScrollY } from "@/lib/coach-scroll-storage";

export function isCoachScrollPath(pathname: string): boolean {
  return /^\/coach(\/|$)/.test(pathname);
}

export function readCoachScrollYFromStorage(
  storage: Pick<Storage, "getItem">,
  key: string = COACH_SCROLL_STORAGE_KEY,
): number | null {
  try {
    const raw = storage.getItem(key);
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
  scrollBehaviorStyle: { scrollBehavior: string };
  key?: string;
}): boolean {
  if (!isCoachScrollPath(options.pathname)) {
    return false;
  }
  const y = readCoachScrollYFromStorage(options.storage, options.key);
  if (y === null || y <= 0) {
    return false;
  }
  const target = clampCoachScrollTarget(
    y,
    options.scrollHeight,
    options.innerHeight,
  );
  options.scrollBehaviorStyle.scrollBehavior = "auto";
  options.scrollTo(0, target);
  return true;
}

export function coachScrollBootstrapScriptBody(key: string): string {
  return `
function onCoach(){return/^\\/coach(\\/|$)/.test(location.pathname);}
function readY(){try{var raw=sessionStorage.getItem(${JSON.stringify(key)});if(raw===null)return null;var y=parseInt(raw,10);return isFinite(y)?y:null;}catch(e){return null;}}
function restore(){if(!onCoach())return;var y=readY();if(y===null||y<=0)return;var max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);var t=Math.min(y,max);document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,t);}
if(onCoach()){try{history.scrollRestoration='auto';}catch(e){}}
restore();
window.addEventListener('pageshow',function(){restore();});
window.addEventListener('popstate',function(){restore();});
`.trim();
}

import { COACH_SCROLL_STORAGE_KEY } from "@/lib/coach-scroll-key";

/** Runs before first paint on /coach to restore scrollY (back + tab return). */
export function coachScrollBootstrapScript(): string {
  const key = COACH_SCROLL_STORAGE_KEY;
  return `(function(){var k=${JSON.stringify(key)};function onCoach(){return/^\\/coach(\\/|$)/.test(location.pathname);}function readY(){try{var raw=sessionStorage.getItem(k);if(raw===null)return null;var y=parseInt(raw,10);return isFinite(y)?y:null;}catch(e){return null;}}function restore(){if(!onCoach())return;var y=readY();if(y===null||y<=0)return;var max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);var t=Math.min(y,max);document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,t);}restore();window.addEventListener('pageshow',function(e){if(e.persisted)restore();});window.addEventListener('popstate',function(){requestAnimationFrame(restore);});})();`;
}

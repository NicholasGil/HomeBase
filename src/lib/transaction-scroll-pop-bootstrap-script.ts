/** Inline before paint: txn history pop restore (survives full reload + beats Playwright URL wait). */
export function transactionScrollPopBootstrapScript(): string {
  return `(function(){
var POP_KEY='realtyrise.transaction.popRestorePath';
var PREFIX='realtyrise.transaction.scrollY.v1:';
function txnPath(p){return p&&p.indexOf('/transactions/')===0;}
function readY(p){try{var r=sessionStorage.getItem(PREFIX+p);if(r===null)return null;var y=parseInt(r,10);return isFinite(y)?y:null;}catch(e){return null;}}
function clamp(y,h,ih){var m=Math.max(0,h-ih);return Math.min(Math.max(0,y),m);}
function restore(p){var y=readY(p);if(y===null||y<=0)return;var mh=y+window.innerHeight;if(document.documentElement.scrollHeight<mh){document.documentElement.style.minHeight=mh+'px';}var t=clamp(y,document.documentElement.scrollHeight,window.innerHeight);window.scrollTo(0,t);}
function markPop(p){if(!txnPath(p))return;try{sessionStorage.setItem(POP_KEY,p);}catch(e){}}
function consumePop(p){try{var pending=sessionStorage.getItem(POP_KEY);if(pending===p){sessionStorage.removeItem(POP_KEY);return true;}}catch(e){}return false;}
window.addEventListener('popstate',function(){var p=location.pathname;if(!txnPath(p))return;markPop(p);restore(p);},true);
var p=location.pathname;
if(txnPath(p)&&consumePop(p)){restore(p);}
})();`;
}

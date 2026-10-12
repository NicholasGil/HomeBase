type Listener = () => void;

let askInputFocused = false;
const listeners = new Set<Listener>();

export function setCoachAskInputFocused(focused: boolean) {
  if (askInputFocused === focused) {
    return;
  }
  askInputFocused = focused;
  if (typeof document !== "undefined") {
    document.documentElement.toggleAttribute(
      "data-coach-ask-focused",
      focused,
    );
  }
  for (const listener of listeners) {
    listener();
  }
}

export function getCoachAskInputFocused() {
  return askInputFocused;
}

export function subscribeCoachAskInputFocused(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

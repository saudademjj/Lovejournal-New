type AppEvent = { type: "map:invalidate"; payload?: Record<string, unknown> };

const emitter = new EventTarget();
const channel = typeof window !== "undefined" && "BroadcastChannel" in window ? new BroadcastChannel("lovejournal-events") : null;

export function emitAppEvent(event: AppEvent) {
  const detailEvent = new CustomEvent(event.type, { detail: event.payload || {} });
  emitter.dispatchEvent(detailEvent);
  if (channel) {
    channel.postMessage(event);
  }
}

export function onAppEvent(type: AppEvent["type"], handler: (event: AppEvent) => void) {
  const listener = (e: Event) => handler({ type, payload: (e as CustomEvent).detail });
  emitter.addEventListener(type, listener);

  const channelListener = (e: MessageEvent<AppEvent>) => {
    if (e.data?.type === type) {
      handler(e.data);
    }
  };
  channel?.addEventListener("message", channelListener);

  return () => {
    emitter.removeEventListener(type, listener);
    channel?.removeEventListener("message", channelListener);
  };
}

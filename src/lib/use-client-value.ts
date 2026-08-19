"use client";

import { useSyncExternalStore } from "react";

/** Nothing to subscribe to: these values are read once and do not change. */
const NEVER_CHANGES = () => () => {};

/**
 * Read a value that only exists in the browser.
 *
 * The obvious way to do this is to default the state to something safe and
 * fill it in from an effect on mount. That works, but it renders twice every
 * time and React now flags it — the second render exists only to deliver a
 * value that was available the moment the component reached the client.
 *
 * It cannot simply be read during render either: `window` and `localStorage`
 * do not exist during the server render, and reading them during the first
 * client render gives back different markup than the server sent, which is a
 * hydration mismatch.
 *
 * `useSyncExternalStore` is the way out. It takes a server snapshot to render
 * on the server and during hydration, and the real value immediately after.
 *
 * `read` MUST return a primitive, or a cached object that is identical between
 * calls. Building a fresh object each time makes React think the store keeps
 * changing and it will loop.
 */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(NEVER_CHANGES, read, () => serverValue);
}

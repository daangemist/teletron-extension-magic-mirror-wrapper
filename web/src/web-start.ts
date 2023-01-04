import type { WebStart } from 'teletron';

let webStarts: Record<string, WebStart> = {};

export const setWebStart = (module: string, ws: WebStart) => {
  webStarts[module] = ws;
};

export const getWebStart = (module: string): WebStart => {
  if (typeof webStarts[module] === 'undefined') {
    throw new Error(`WebStart was not set for ${module}`);
  }
  return webStarts[module] as WebStart;
};

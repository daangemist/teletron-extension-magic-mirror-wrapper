import type { WebStart } from 'teletron';

export const setWebStart = (module: string, ws: WebStart) => {
  if (typeof window.webStarts === 'undefined') {
    window.webStarts = {};
  }

  window.webStarts[module] = ws;
};

export const getWebStart = (module: string): WebStart => {
  if (
    typeof window.webStarts === 'undefined' ||
    typeof window.webStarts[module] === 'undefined'
  ) {
    throw new Error(`WebStart was not set for ${module}`);
  }
  return window.webStarts[module] as WebStart;
};

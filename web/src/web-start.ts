import type { WebStart } from 'teletron';

let webStart: WebStart;

export const setWebStart = (ws: WebStart) => {
  webStart = ws;
};

export const getWebStart = () => {
  if (!webStart) {
    throw new Error('WebStart was not set.');
  }
  return webStart;
};

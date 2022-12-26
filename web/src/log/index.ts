const isDebug = !!localStorage.getItem('mmDebug');
const noop = () => {};

export const debugLog = isDebug ? console.log : noop;

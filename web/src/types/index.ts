// Copied and adapted from module-types.ts in the MagicMirror project.
export type ModuleProperties = {
  defaults?: object,
  start?(): void,
  getHeader?(): string,
  getTemplate?(): string,
  getTemplateData?(): object,
  notificationReceived?: (notification: string, payload: any, sender?: object) => void,
  socketNotificationReceived?(notification: string, payload: any): void,
  suspend?(): void,
  resume?(): void,
  getDom?(): HTMLElement|Promise<HTMLElement>,
  getStyles?(): string[],
  getScripts?(): string[],
  [key: string]: any,
};

import type { WebStart } from 'teletron';
import type { Module } from '../module';

// Copied and adapted from module-types.ts in the MagicMirror project.
export type ModuleProperties = {
  defaults?: object;
  start?(): void;
  getHeader?(): string;
  getTemplate?(): string;
  getTemplateData?(): object;
  notificationReceived?: (
    notification: string,
    payload: any,
    sender?: object
  ) => void;
  socketNotificationReceived?(notification: string, payload: any): void;
  suspend?(): void;
  resume?(): void;
  getDom?(): HTMLElement | Promise<HTMLElement>;
  getStyles?(): string[];
  getScripts?(): string[];
  [key: string]: any;
};

// Extend the window webStarts property
declare global {
  interface Window {
    webStarts: Record<string, WebStart> | undefined;
    Module: Module;
  }
}

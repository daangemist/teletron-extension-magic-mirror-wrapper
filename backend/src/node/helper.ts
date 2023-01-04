import type express from 'express';

export class Helper {
  expressApp?: express.Router;
  name = '';
  path = '';
  moduleDefinition: Record<string, any> = {};
  socketDispatch: ((notification: string, payload: any) => void) | undefined;

  constructor(moduleDefinition: any) {
    this.moduleDefinition = moduleDefinition;
    Object.entries(moduleDefinition).forEach(([key, value]) => {
      if (typeof value === 'function') {
        this.moduleDefinition[key] = value.bind(this);
      }
    });
  }

  public setRouter(router: express.Router) {
    this.expressApp = router;
  }

  public setName(name: string) {
    this.name = name;
  }

  public setPath(path: string) {
    this.path = path;
  }

  public setSocketDispatch(
    dispatch: (notification: string, payload: any) => void
  ) {
    this.socketDispatch = dispatch;
  }

  public startHelper() {
    if (this.moduleDefinition['start']) {
      this.moduleDefinition['start']();
    } else {
      console.log('Module had no start() function.');
    }
  }

  public processSocketNotification(notification: string, payload: any) {
    if (this.moduleDefinition['socketNotificationReceived']) {
      this.moduleDefinition['socketNotificationReceived'](
        notification,
        payload
      );
    }
  }

  public sendSocketNotification(notification: string, payload: any) {
    if (!this.socketDispatch) {
      throw new Error('No socket dispatch function set.');
    }
    this.socketDispatch(notification, payload);
  }
}

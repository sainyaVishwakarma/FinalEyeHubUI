import type { LogType } from '@/types/LogType';
export default class Logger {
  private logs: string[];
  private static instance: Logger;
  private constructor() {
    this.logs = [];
  }
  public static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  log(message: string, logType: LogType) {
    this.logs.push(message);
    console?.[logType](message);
  }
}

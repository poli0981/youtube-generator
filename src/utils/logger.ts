import { useLogStore, type LogLevel } from "@store/log-store";

function log(level: LogLevel, source: string, message: string, details?: string) {
  useLogStore.getState().addEntry({ level, source, message, details });
}

export const logger = {
  error: (source: string, message: string, details?: string) =>
    log("error", source, message, details),
  warn: (source: string, message: string, details?: string) =>
    log("warn", source, message, details),
  info: (source: string, message: string, details?: string) =>
    log("info", source, message, details),
  debug: (source: string, message: string, details?: string) =>
    log("debug", source, message, details),
};

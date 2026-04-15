export type LogSeverity = 'info' | 'warn' | 'error';

export type EmitLog = (text: string, severity?: LogSeverity) => void;

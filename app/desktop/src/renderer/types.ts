export interface LogEntry {
  text: string;
  time: number;
}

export interface DetectedPaths {
  steamPath: string | null;
  cs2CfgPath: string | null;
  annotationsPath: string | null;
  videoCfgPath: string | null;
}

export interface SteamUser {
  id: string;
}

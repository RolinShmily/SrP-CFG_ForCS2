import type { Cs2InstallState, SteamUser } from "../renderer/types";

export class AppState {
  steamPath: string | null = null;
  cs2InstallState: Cs2InstallState = "not-installed";
  cs2InstallDir: string | null = null;
  cs2CfgPath: string | null = null;
  annotationsPath: string | null = null;
  videoCfgPath: string | null = null;
  steamUsers: SteamUser[] = [];
  currentUser: SteamUser | null = null;
  hasAutoLoginUser = false;

  reset(): void {
    this.steamPath = null;
    this.cs2InstallState = "not-installed";
    this.cs2InstallDir = null;
    this.cs2CfgPath = null;
    this.annotationsPath = null;
    this.videoCfgPath = null;
    this.steamUsers = [];
    this.currentUser = null;
    this.hasAutoLoginUser = false;
  }
}

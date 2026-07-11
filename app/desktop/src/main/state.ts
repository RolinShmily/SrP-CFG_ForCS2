import type { Cs2InstallState, SteamUser } from "../renderer/types";
import type { VcfgStateSummary } from "../renderer/types";

export class AppState {
  steamPath: string | null = null;
  cs2InstallState: Cs2InstallState = "not-installed";
  cs2InstallDir: string | null = null;
  cs2CfgPath: string | null = null;
  annotationsPath: string | null = null;
  userCfgPath: string | null = null;
  vcfgState: VcfgStateSummary = {
    available: false,
    bindings: 0,
    analogBindings: 0,
    cloudConvars: 0,
    machineConvars: 0,
    hasCloudMirror: false,
    hasVideoConfig: false,
  };
  steamUsers: SteamUser[] = [];
  currentUser: SteamUser | null = null;
  hasAutoLoginUser = false;

  reset(): void {
    this.steamPath = null;
    this.cs2InstallState = "not-installed";
    this.cs2InstallDir = null;
    this.cs2CfgPath = null;
    this.annotationsPath = null;
    this.userCfgPath = null;
    this.vcfgState = {
      available: false,
      bindings: 0,
      analogBindings: 0,
      cloudConvars: 0,
      machineConvars: 0,
      hasCloudMirror: false,
      hasVideoConfig: false,
    };
    this.steamUsers = [];
    this.currentUser = null;
    this.hasAutoLoginUser = false;
  }
}

import logger from "../logger";
import { authorities } from "../utils";

export class Authority {
  private static authority: Authority;

  walletsMap: Map<string, number> = new Map([]);

  private constructor() {
    for (const auth of authorities) {
      this.walletsMap.set(auth, 0);
    }
  }

  static getInstance() {
    if (!this.authority) {
      Authority.authority = new Authority();
    }
    return Authority.authority;
  }

  public getAuthority() {
    const auth = this.walletsMap.get(authorities[0]) ?? 0;
    let selectedAuthority = authorities[0];
    for (const auths of authorities) {
      if ((this.walletsMap.get(auths) ?? 0) < auth) {
        selectedAuthority = auths;
      }
    }

    logger.info(`Picked: ${selectedAuthority}`);
    const previous = this.walletsMap.get(selectedAuthority) ?? 0;
    this.walletsMap.set(selectedAuthority, previous + 1);
    return selectedAuthority;
  }
}

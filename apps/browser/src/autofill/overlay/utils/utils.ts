import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

function getAuthStatus(): Promise<AuthenticationStatus> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ command: "bgCheckAuthStatus" }, (status: AuthenticationStatus) => {
      resolve(status);
    });
  });
}

export { getAuthStatus };

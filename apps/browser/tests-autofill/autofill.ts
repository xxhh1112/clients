import { collect } from "@bitwarden/browser/content/autofill_collect";

(window as any).collect = () => {
  return collect(document);
};

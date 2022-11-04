import { collect, fill } from "@bitwarden/browser/content/autofill_collect";

(window as any).collect = () => {
  console.log("COLLECT");
  return collect(document);
};

(window as any).autofill = (fillScript: any) => {
  console.log("HI");
  console.log(fillScript);
  return fill(document, fillScript);
};

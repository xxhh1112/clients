export abstract class ButtonLikeAbstraction {
  loading: boolean;
  disabled: boolean;
  setButtonType: (value: "primary" | "secondary" | "danger") => void;
}

export type ButtonType = "primary" | "secondary" | "danger" | "unstyled";

export type ButtonGroupings = "none" | "first" | "inner" | "last";

export abstract class ButtonLikeAbstraction {
  loading: boolean;
  disabled: boolean;
  setButtonType: (value: ButtonType) => void;
  grouping?: ButtonGroupings;
}

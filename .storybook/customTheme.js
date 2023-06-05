import { create } from "@storybook/theming/create";

export default create({
  base: "light",
  // Typography
  fontBase: '"Open Sans", sans-serif',

  //logo and Title
  brandTitle: "Bitwarden Component Library",
  brandUrl: "https://components.bitwarden.com",
  brandImage:
    "https://github.com/bitwarden/brand/blob/51942f8d6e55e96a078a524e0f739efbf1997bcf/logos/logo-horizontal-blue.png?raw=true",
  brandTarget: "_self",

  //Colors
  colorPrimary: "#6D757E",
  colorSecondary: "#175DDC",

  // UI
  appBg: "#f9fBff",
  appContentBg: "#ffffff",
  appBorderColor: "#CED4DC",

  // Text colors
  textColor: "#212529",
  textInverseColor: "#ffffff",

  // Toolbar default and active colors
  barTextColor: "#6D757E",
  barSelectedColor: "#175DDC",
  barBg: "#ffffff",

  // Form colors
  inputBg: "#ffffff",
  inputBorder: "#6D757E",
  inputTextColor: "#6D757E",
});

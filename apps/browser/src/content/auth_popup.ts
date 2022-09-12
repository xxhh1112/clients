export const authPopupHtml = `
  <style>
    .bit-auth-wrapper {
      position: fixed;
      display: flex;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgb(0 0 0 / 0.6);
      align-items: center;
      justify-content: center;
    }

    .bit-auth {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      width: 500px;
      height: 400px;
      background: white;
      border-radius: 10px;
      box-shadow: -1px -1px 16px 2px rgba(0,0,0,0.25);
    }

    .bit-auth img {
      width: 200px;
      margin-bottom: 40px;
    }

    .bit-auth-help-text {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
      font-size: 14px;
    }
  </style>
  <div class="bit-auth-wrapper">
    <div class="bit-auth">
      <img src="https://raw.githubusercontent.com/bitwarden/brand/master/logos/logo-vertical.png">
      <div class="bit-auth-help-text">
        Open Bitwarden to authenticate
      </div>
    </div>
  </div>
`;

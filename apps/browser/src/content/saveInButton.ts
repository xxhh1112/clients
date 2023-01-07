import AddLoginRuntimeMessage from "../background/models/addLoginRuntimeMessage";

document.addEventListener("DOMContentLoaded", (event) => {
  const buttons: Button[] = [];
  for (const saveButton of document.querySelectorAll("onepassword-save-button")) {
    const shadowRoot = saveButton.shadowRoot;
    if (shadowRoot == null) {
      continue;
    }
    const style = shadowRoot.querySelector("style");
    if (style != null) {
      style.innerHTML += `.onepasswordSaveBtn { background: #175DDC }`;
    }

    const buttonEl = shadowRoot.querySelector("button[data-onepassword-save-button]");
    const infoEl = shadowRoot.querySelector("#onepassword-info-icon");
    if (buttonEl != null) {
      buttons.push({
        btnElement: buttonEl as HTMLButtonElement,
        infoElement: infoEl as HTMLButtonElement,
      });
    }
  }

  for (const button of buttons) {
    button.btnElement.disabled = false;
    const type = button.btnElement.getAttribute("data-onepassword-type");
    const label = button.btnElement.querySelector(".label");
    const icon = button.btnElement.querySelector("#onepassword-icon");
    const infoLabel = button.infoElement.querySelector("#onepassword-info-icon span");
    const infoIconPath = button.infoElement.querySelector("svg > path");
    if (infoLabel != null) {
      infoLabel.textContent = "Click to learn more about Bitwarden";
    }
    if (infoIconPath != null) {
      infoIconPath.setAttribute("fill", "#175DDC");
    }
    if (label != null) {
      label.textContent = "Save in Bitwarden";
    }
    if (icon != null) {
      icon.setAttribute("width", "18px");
      icon.setAttribute("height", "21px");
      icon.setAttribute("viewBox", "0 0 18 21");
      icon.innerHTML = `<path fill="white" d="M 17.371094 0.554688 C 17.203125 0.386719 17 0.300781 16.769531 0.300781
        L 1.230469 0.300781 C 0.996094 0.300781 0.796875 0.386719 0.628906 0.554688 C 0.457031 0.722656 0.371094
        0.917969 0.371094 1.148438 L 0.371094 11.351562 C 0.371094 12.109375 0.523438 12.867188 0.820312 13.613281
        C 1.121094 14.363281 1.496094 15.027344 1.941406 15.605469 C 2.386719 16.1875 2.917969 16.75 3.535156
        17.296875 C 4.148438 17.84375 4.722656 18.300781 5.242188 18.664062 C 5.765625 19.027344 6.308594 19.367188
        6.875 19.691406 C 7.445312 20.011719 7.847656 20.230469 8.085938 20.351562 C 8.324219 20.464844 8.515625
        20.554688 8.660156 20.613281 C 8.765625 20.667969 8.882812 20.695312 9.007812 20.695312 C 9.132812 20.695312
        9.253906 20.667969 9.359375 20.613281 C 9.503906 20.550781 9.695312 20.464844 9.933594 20.351562 C 10.171875
        20.238281 10.574219 20.011719 11.140625 19.691406 C 11.710938 19.367188 12.253906 19.023438 12.773438
        18.664062 C 13.296875 18.300781 13.863281 17.84375 14.484375 17.296875 C 15.097656 16.746094 15.628906
        16.183594 16.074219 15.605469 C 16.519531 15.023438 16.890625 14.359375 17.191406 13.613281 C 17.492188
        12.863281 17.644531 12.109375 17.644531 11.351562 L 17.644531 1.148438 C 17.628906 0.917969 17.542969 0.722656
        17.371094 0.554688 Z M 15.371094 11.445312 C 15.371094 15.136719 9 18.316406 9 18.316406 L 9 2.480469 L
        15.371094 2.480469 C 15.371094 2.480469 15.371094 7.753906 15.371094 11.445312 Z M 15.371094 11.445312 "/>`;
    }
    document.dispatchEvent(
      new CustomEvent("OPButtonEvent", {
        detail: {
          header: "What's Save in Bitwarden?",
          buttonId: button.btnElement.getAttribute("id"),
          body: [
            {
              text: "Save this " + type.replace("-", " ") + " in Bitwarden automatically.",
            },
          ],
        },
      })
    );
    button.btnElement.addEventListener("click", () => {
      // TODO: check if type is supported ands end error if not.
      clickedSaveButton(button);
    });
  }

  function clickedSaveButton(button: Button) {
    const login = new AddLoginRuntimeMessage();
    login.username = "testuserfromsave";
    login.password = "123141234";
    login.url = document.URL;
    chrome.runtime.sendMessage({
      command: "bgAddLogin",
      login: login,
    });
  }

  class Button {
    btnElement: HTMLButtonElement;
    infoElement: HTMLButtonElement;
  }
});

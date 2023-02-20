function config(browser, version) {
  return {
    manifest_version: version,
    ...(version == 3
      ? {
          minimum_chrome_version: "102.0",
        }
      : []),
    name: "__MSG_extName__",
    short_name: "__MSG_appName__",
    version: "2023.2.0",
    description: "__MSG_extDesc__",
    default_locale: "en",
    author: "Bitwarden Inc.",
    homepage_url: "https://bitwarden.com",
    icons: {
      16: "images/icon16.png",
      32: "images/icon32.png",
      48: "images/icon48.png",
      96: "images/icon96.png",
      128: "images/icon128.png",
    },
    action: {
      default_icon: {
        19: "images/icon19.png",
        38: "images/icon38.png",
      },
      default_title: "Bitwarden",
      default_popup: "popup/index.html",
    },
  };
}

function contentScripts(browser, version) {
  return {
    content_scripts: [
      {
        all_frames: true,
        js: [
          "content/autofill.js",
          "content/autofiller.js",
          "content/notificationBar.js",
          "content/contextMenuHandler.js",
        ],
        matches: ["http://*/*", "https://*/*", "file:///*"],
        run_at: "document_start",
      },
      {
        all_frames: false,
        js: ["content/message_handler.js"],
        matches: ["http://*/*", "https://*/*", "file:///*"],
        run_at: "document_start",
      },
      {
        all_frames: true,
        css: ["content/autofill.css"],
        matches: ["http://*/*", "https://*/*", "file:///*"],
        run_at: "document_end",
      },
      ...(version === 3
        ? [
            {
              all_frames: true,
              js: ["content/misc-utils.js"],
              matches: ["http://*/*", "https://*/*", "file:///*"],
              run_at: "document_end",
            },
          ]
        : []),
    ],
  };
}

function background(browser, version) {
  return version == 2
    ? {
        background: {
          page: "background.html",
          persistent: true,
        },
      }
    : {
        background: {
          service_worker: "background.js",
          type: "module",
        },
      };
}

function permissions(browser, version) {
  const obj = {
    permissions: [
      "tabs",
      "contextMenus",
      "storage",
      "unlimitedStorage",
      "clipboardRead",
      "clipboardWrite",
      "idle",
      "http://*/*",
      "https://*/*",
      "webRequest",
      "webRequestBlocking",
    ],
  };

  if (browser != "safari") {
    obj.optional_permissions = ["nativeMessaging"];
  }

  return obj;
}

function contentSecurityPolicy(browser, version) {
  if (version == 2) {
    return {
      content_security_policy: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    };
  }

  return {
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
  };
}

function commands(browser, version) {
  const browserActionName = version == 2 ? "_execute_browser_action" : "_execute_action";

  return {
    commands: {
      [browserActionName]: {
        suggested_key: {
          default: "Ctrl+Shift+Y",
          linux: "Ctrl+Shift+U",
        },
        description: "__MSG_commandOpenPopup__",
      },
      autofill_login: {
        suggested_key: {
          default: "Ctrl+Shift+L",
        },
        description: "__MSG_commandAutofillDesc__",
      },
      generate_password: {
        suggested_key: {
          default: "Ctrl+Shift+9",
        },
        description: "__MSG_commandGeneratePasswordDesc__",
      },
      lock_vault: {
        description: "__MSG_commandLockVaultDesc__",
      },
    },
  };
}

function webAccessibleResources(browser, version) {
  if (version == 2) {
    return {
      web_accessible_resources: [
        "notification/bar.html",
        "images/icon38.png",
        "images/icon38_locked.png",
      ],
    };
  }

  return {
    web_accessible_resources: {
      resources: ["notification/bar.html", "images/icon38.png", "images/icon38_locked.png"],
      matches: ["<all_urls>"],
    },
  };
}

function applications(browser, version) {
  if (browser != "firefox") {
    return;
  }

  return {
    applications: {
      gecko: {
        id: "{446900e4-71c2-419f-a6a7-df9c091e268b}",
        strict_min_version: "42.0",
      },
    },
  };
}

function sidebarAction(browser, version) {
  if (browser != "firefox" && browser != "opera") {
    return;
  }

  return {
    sidebar_action: {
      default_title: "Bitwarden",
      default_panel: "popup/index.html?uilocation=sidebar",
      default_icon: "images/icon19.png",
    },
  };
}

function storage(browser, version) {
  if (browser == "firefox") {
    return;
  }

  return {
    storage: {
      managed_schema: "managed_schema.json",
    },
  };
}

function build(browser, version) {
  const c = {
    ...config(browser, version),
    ...contentScripts(browser, version),
    ...background(browser, version),
    ...permissions(browser, version),
    ...contentSecurityPolicy(browser, version),
    ...commands(browser, version),
    ...webAccessibleResources(browser, version),
    ...applications(browser, version),
    ...sidebarAction(browser, version),
    ...storage(browser, version),
  };

  return JSON.stringify(c, null, 2);
}

module.exports = build;

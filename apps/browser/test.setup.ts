// Add chrome storage api
const QUOTA_BYTES = 10;
const storage = {
  local: {
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
    QUOTA_BYTES,
    getBytesInUse: jest.fn(),
    clear: jest.fn(),
  },
  session: {
    set: jest.fn(),
    get: jest.fn(),
    has: jest.fn(),
    remove: jest.fn(),
  },
};

const runtime = {
  onMessage: {
    addListener: jest.fn(),
  },
  sendMessage: jest.fn(),
  getManifest: jest.fn(),
  onConnect: {
    addListener: jest.fn(),
  },
  connect: jest.fn(),
};

const contextMenus = {
  create: jest.fn(),
  removeAll: jest.fn(),
};

// set chrome
global.chrome = {
  storage,
  runtime,
  contextMenus,
} as any;

export function makePort(name: string): chrome.runtime.Port {
  return {
    name,
    onDisconnect: {
      addListener: jest.fn(),
    },
    onMessage: {
      addListener: jest.fn(),
    },
    postMessage: jest.fn(),
  } as any;
}

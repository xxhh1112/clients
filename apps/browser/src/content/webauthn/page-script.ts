// eslint-disable-next-line no-console
console.log("page-script loaded");

const browserCredentials = {
  create: navigator.credentials.create.bind(navigator.credentials),
  get: navigator.credentials.get.bind(navigator.credentials),
};

// Intercept

navigator.credentials.create = async (options?: CredentialCreationOptions): Promise<Credential> => {
  alert("Intercepted: create");

  return await browserCredentials.create(options);
};

navigator.credentials.get = async (options?: CredentialRequestOptions): Promise<Credential> => {
  alert("Intercepted: get");

  return await browserCredentials.get(options);
};

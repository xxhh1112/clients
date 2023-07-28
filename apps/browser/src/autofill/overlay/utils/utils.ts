function getAuthStatusFromQueryParam(): number {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const authStatus = urlParams.get("authStatus");

  return authStatus ? parseInt(authStatus) : null;
}

export { getAuthStatusFromQueryParam };

export function getHostId() {
  return new URLSearchParams(location.search).get('id');
}

export function getJoinLink(id: string) {
  return `${location.origin}${location.pathname}?id=${id}`;
}

export function removeUrlParams() {
  history.replaceState(
    {},
    document.title,
    `${location.origin}${location.pathname}`,
  );
}

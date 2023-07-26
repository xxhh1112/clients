export const paginateArray = <T>(data: T[], pageSize: number, pageThreshold: number) => {
  const pages: T[][] = [];
  for (let i = 0; i < data.length; i = i + pageSize) {
    const slice = data.slice(i, i + pageSize);
    if (slice.length < pageThreshold) {
      // Append to the previous page
      const idx = pages.length - 1;
      pages[idx] = pages[idx].concat(slice);
    } else {
      // Add new page
      pages.push(slice);
    }
  }
  return pages;
};

export type Nullable<T> = T | null;

export const download = (
  filename: string,
  content: any,
  mime = 'text/plain'
) => {
  const a = document.createElement('a');
  a.download = filename;
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.click();
};

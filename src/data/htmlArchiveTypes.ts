export type HtmlArchivePage = {
  id: string;
  title: string;
  sourceFile: string;
  css: string;
  bodyHtml: string;
};

export type HtmlArchive = {
  key: string;
  title: string;
  pages: HtmlArchivePage[];
};

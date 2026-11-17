/** A paragraph, or a bulleted list of short items. */
export type LegalBlock = string | { list: string[] };

export type LegalSection = {
  /** Anchor id for the contents list, e.g. "what-we-collect". */
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  title: string;
  /** One sentence under the title. */
  summary: string;
  /** Date of this draft, ISO format. Shown as "Draft of …" until counsel signs the text off. */
  draftDate: string;
  sections: LegalSection[];
};

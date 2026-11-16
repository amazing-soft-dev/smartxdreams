/**
 * The JSON body every form endpoint answers with. On failure, `fields` maps field names to messages the
 * form shows next to each field; `message` is a sentence the form can show as is.
 */
export type FormSuccess = { ok: true };

export type FormFailure = {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
};

export type FormResponse = FormSuccess | FormFailure;

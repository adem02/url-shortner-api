export interface RedirectToUrlByCodeParams {
  code: string;
}

export interface SaveClickDataPayload {
  linkId: string;
  country: string | null;
  device: string | null;
  browser: string | null;
  clickedAt: Date;
}

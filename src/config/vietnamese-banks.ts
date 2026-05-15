/**
 * Vietnamese banks dropdown options for the donate / Vietnam-specific
 * bank field. Sourced from the State Bank of Vietnam's published list
 * (sbv.gov.vn) of operating credit institutions as of 2026: Big 4
 * state-owned commercial banks, top 22 joint-stock commercial banks
 * (TMCP) by retail presence, and the four most-recognised 100%
 * foreign-owned banks operating in Vietnam.
 *
 * Order is intentional, not alphabetical: Big 4 first (highest brand
 * recognition for retail transfers), then the dominant private TMCP
 * banks roughly by retail footprint, then the foreign banks. A
 * sentinel `__other__` option is appended by the editor component
 * itself so the renderer can surface a fall-through text input for
 * banks the creator's audience uses that aren't on the list (e.g.
 * regional / digital-only banks).
 *
 * Values double as labels — the bank's common Vietnamese display name
 * is what gets persisted into the editor draft and rendered into the
 * Vietnamese donate block. Keep the string spellings stable: changing
 * one would silently turn a previously-saved profile into a "custom"
 * entry on next render. If a bank rebrands (e.g. LienVietPostBank →
 * LPBank in 2024), add the new name and keep the old as an alias in
 * a separate constant rather than mutating in place.
 */
export const VIETNAMESE_BANKS = [
  // Big 4 state-owned commercial banks
  "Vietcombank",
  "BIDV",
  "VietinBank",
  "Agribank",
  // Top joint-stock commercial banks (TMCP), roughly by retail presence
  "Techcombank",
  "MB Bank",
  "ACB",
  "VPBank",
  "TPBank",
  "Sacombank",
  "HDBank",
  "VIB",
  "SHB",
  "Eximbank",
  "OCB",
  "MSB",
  "LPBank",
  "SeABank",
  "ABBank",
  "BAC A Bank",
  "PVcomBank",
  "NCB",
  "Nam A Bank",
  "KienlongBank",
  "Saigonbank",
  "VietABank",
  "Vietbank",
  "BVBank",
  // 100% foreign-owned banks with the strongest retail presence in VN
  "HSBC Vietnam",
  "Standard Chartered",
  "Shinhan Bank",
  "UOB Vietnam",
] as const;

export type VietnameseBank = (typeof VIETNAMESE_BANKS)[number];

/** Sentinel select-option value the editor uses to surface a fall-through
 *  text input. Kept as a non-bank-name string so a real bank could
 *  never collide with it. */
export const VIETNAMESE_BANK_OTHER = "__other__" as const;

/**
 * True when `value` is a non-empty string that doesn't match any preset
 * bank — i.e. the editor should render the custom text input below the
 * select. Pure helper so the conditional logic in
 * `VietnameseDonateEditor` stays declarative.
 */
export function isCustomVietnameseBank(value: string): boolean {
  if (!value) return false;
  return !(VIETNAMESE_BANKS as readonly string[]).includes(value);
}

// Address value object — docs/03_database_design.md §9.1.1: `addresses` is EMBEDDED because it is
// "bounded (typically <10), always fetched with checkout/profile". Framework-free (docs/06 §4.3).

/** docs/03 §9.1.1's bound, confirmed by docs/08 §8's `users` row ("max 10"). */
export const MAX_ADDRESSES = 10;

export interface Address {
  readonly label: string;
  readonly line1: string;
  // `| undefined` under exactOptionalPropertyTypes — an omitted line2 and an explicit
  // `line2: undefined` are distinct, and the Zod schema can produce either.
  readonly line2?: string | null | undefined;
  readonly city: string;
  readonly state: string;
  readonly pincode: string;
  readonly country: string;
  readonly isDefault: boolean;
}

/**
 * Domain invariant, re-checked independently of the Presentation-layer Zod schema
 * (docs/02 §16's defense-in-depth rule).
 */
export function exceedsAddressBound(addresses: readonly Address[]): boolean {
  return addresses.length > MAX_ADDRESSES;
}

// ASSUMPTION: the backend has no country-list endpoint, so this is a static
// ISO 3166-1 alpha-2 list maintained client-side. `country` filter values and
// the `country` field on user records are expected to be alpha-2 codes.
export const COUNTRIES: { code: string; name: string }[] = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "IE", name: "Ireland" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "IN", name: "India" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
].sort((a, b) => a.name.localeCompare(b.name));

const COUNTRY_NAME_BY_CODE = new Map(
  COUNTRIES.map((country) => [country.code, country.name])
);

export function countryName(code: string): string {
  return COUNTRY_NAME_BY_CODE.get(code) ?? code;
}

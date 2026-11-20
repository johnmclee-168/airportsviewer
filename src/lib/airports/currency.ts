/**
 * Currency lookup for an airport's country.
 *
 * The Qantas airports API has no currency field, so we map the ISO 3166-1
 * country code to its ISO 4217 currency (current as of 2026, e.g. Bulgaria → EUR,
 * Croatia → EUR, Curaçao/Sint Maarten → XCG) and use Intl for the display name
 * and symbol. Legacy country codes in the data (AN, CS, YU) map to their
 * successor states' currency. Antarctica has no currency.
 */

const CURRENCY_BY_COUNTRY: Readonly<Record<string, string>> = {
  AD: "EUR", AE: "AED", AF: "AFN", AG: "XCD", AI: "XCD", AL: "ALL", AM: "AMD",
  AN: "XCG", AO: "AOA", AR: "ARS", AS: "USD", AT: "EUR", AU: "AUD", AW: "AWG",
  AZ: "AZN", BA: "BAM", BB: "BBD", BD: "BDT", BE: "EUR", BF: "XOF", BG: "EUR",
  BH: "BHD", BI: "BIF", BJ: "XOF", BM: "BMD", BN: "BND", BO: "BOB", BR: "BRL",
  BS: "BSD", BT: "BTN", BW: "BWP", BY: "BYN", BZ: "BZD", CA: "CAD", CC: "AUD",
  CD: "CDF", CF: "XAF", CG: "XAF", CH: "CHF", CI: "XOF", CK: "NZD", CL: "CLP",
  CM: "XAF", CN: "CNY", CO: "COP", CR: "CRC", CS: "RSD", CU: "CUP", CV: "CVE",
  CX: "AUD", CY: "EUR", CZ: "CZK", DE: "EUR", DJ: "DJF", DK: "DKK", DM: "XCD",
  DO: "DOP", DZ: "DZD", EC: "USD", EE: "EUR", EG: "EGP", ER: "ERN", ES: "EUR",
  ET: "ETB", FI: "EUR", FJ: "FJD", FK: "FKP", FM: "USD", FO: "DKK", FR: "EUR",
  GA: "XAF", GB: "GBP", GD: "XCD", GE: "GEL", GF: "EUR", GH: "GHS", GI: "GIP",
  GL: "DKK", GM: "GMD", GN: "GNF", GP: "EUR", GQ: "XAF", GR: "EUR", GT: "GTQ",
  GU: "USD", GW: "XOF", GY: "GYD", HK: "HKD", HN: "HNL", HR: "EUR", HT: "HTG",
  HU: "HUF", ID: "IDR", IE: "EUR", IL: "ILS", IN: "INR", IQ: "IQD", IR: "IRR",
  IS: "ISK", IT: "EUR", JM: "JMD", JO: "JOD", JP: "JPY", KE: "KES", KG: "KGS",
  KH: "KHR", KI: "AUD", KM: "KMF", KN: "XCD", KP: "KPW", KR: "KRW", KW: "KWD",
  KY: "KYD", KZ: "KZT", LA: "LAK", LB: "LBP", LC: "XCD", LK: "LKR", LR: "LRD",
  LS: "LSL", LT: "EUR", LU: "EUR", LV: "EUR", LY: "LYD", MA: "MAD", MC: "EUR",
  MD: "MDL", ME: "EUR", MG: "MGA", MH: "USD", MK: "MKD", ML: "XOF", MM: "MMK",
  MN: "MNT", MO: "MOP", MP: "USD", MQ: "EUR", MR: "MRU", MS: "XCD", MT: "EUR",
  MU: "MUR", MV: "MVR", MW: "MWK", MX: "MXN", MY: "MYR", MZ: "MZN", NA: "NAD",
  NC: "XPF", NE: "XOF", NF: "AUD", NG: "NGN", NI: "NIO", NL: "EUR", NO: "NOK",
  NP: "NPR", NR: "AUD", NU: "NZD", NZ: "NZD", OM: "OMR", PA: "PAB", PE: "PEN",
  PF: "XPF", PG: "PGK", PH: "PHP", PK: "PKR", PL: "PLN", PM: "EUR", PR: "USD",
  PS: "ILS", PT: "EUR", PW: "USD", PY: "PYG", QA: "QAR", RE: "EUR", RO: "RON",
  RS: "RSD", RU: "RUB", RW: "RWF", SA: "SAR", SB: "SBD", SC: "SCR", SD: "SDG",
  SE: "SEK", SG: "SGD", SH: "SHP", SI: "EUR", SK: "EUR", SL: "SLE", SN: "XOF",
  SO: "SOS", SR: "SRD", ST: "STN", SV: "USD", SY: "SYP", SZ: "SZL", TC: "USD",
  TD: "XAF", TG: "XOF", TH: "THB", TJ: "TJS", TL: "USD", TM: "TMT", TN: "TND",
  TO: "TOP", TR: "TRY", TT: "TTD", TV: "AUD", TW: "TWD", TZ: "TZS", UA: "UAH",
  UG: "UGX", UM: "USD", US: "USD", UY: "UYU", UZ: "UZS", VC: "XCD", VE: "VES",
  VG: "USD", VI: "USD", VN: "VND", VU: "VUV", WF: "XPF", WS: "WST", XK: "EUR",
  YE: "YER", YT: "EUR", YU: "EUR", ZA: "ZAR", ZM: "ZMW", ZW: "ZWG",
};

export interface CurrencyInfo {
  /** ISO 4217 code, e.g. "AUD". */
  code: string;
  /** Localised name, e.g. "Australian Dollar". Falls back to the code. */
  name: string;
  /** Narrow symbol, e.g. "$". Falls back to the code. */
  symbol: string;
}

export function currencyCodeForCountry(countryCode: string): string | null {
  return CURRENCY_BY_COUNTRY[countryCode.toUpperCase()] ?? null;
}

export function getCurrencyInfo(countryCode: string, locale = "en-AU"): CurrencyInfo | null {
  const code = currencyCodeForCountry(countryCode);
  if (!code) return null;
  let name = code;
  let symbol = code;
  try {
    name = new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code;
    symbol =
      new Intl.NumberFormat(locale, { style: "currency", currency: code, currencyDisplay: "narrowSymbol" })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value ?? code;
  } catch {
    // Unknown to this runtime's ICU data: show the bare code.
  }
  return { code, name, symbol };
}

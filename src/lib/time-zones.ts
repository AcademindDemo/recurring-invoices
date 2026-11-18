/** Every IANA time zone the runtime knows, plus UTC, which it lists only as an alias. */
export const timeZones = ['UTC', ...Intl.supportedValuesOf('timeZone')];

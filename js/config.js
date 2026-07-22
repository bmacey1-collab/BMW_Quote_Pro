const APP_CONFIG = Object.freeze({
  appName: "BMW Quote Pro",
  version: "2.1.0",

  // Your public website address. This is used for email-confirmation redirects.
  siteUrl: "https://yourbmwguy.com",

  // Supabase connection values are remembered in this browser after first setup.
  supabaseUrlStorageKey: "vehicleQuoteSupabaseUrl",
  supabaseKeyStorageKey: "vehicleQuoteSupabaseKey",

  presetStorageKey: "vehicleQuoteProgramPresets"
});

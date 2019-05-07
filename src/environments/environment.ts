// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  SITE_URL: 'freezone.local.mg'
};

export const config = {
  jwTokenUrl: 'https://freezone.local.mg/wp-json/jwt-auth/v1/token',
  apiEndpoint: 'https://freezone.local.mg/wp-json',
  wpUrl: 'https://freezone.local.mg/wp-json/wp/v2',
  apiUrl: 'https://freezone.local.mg/wp-json/api'
};
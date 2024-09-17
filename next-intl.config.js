const { getRequestConfig } = require("next-intl/server");

module.exports = getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}));

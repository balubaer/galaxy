declare const __BUILD_COMMIT__: string;

export const APP_VERSION = '1.0';

// Wird beim Webpack-Build durch die kurze Git-Commit-ID ersetzt (siehe webpack.config.js).
export const BUILD_COMMIT =
  typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : 'unbekannt';

import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: 'nx run worlds:serve:development',
        production: 'nx run worlds:serve:production',
      },
      ciWebServerCommand: 'nx run worlds:serve-static',
    }),
    baseUrl: 'http://localhost:4200',
  },
});

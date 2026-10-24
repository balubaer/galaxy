const { NxWebpackPlugin } = require('@nx/webpack');
const { DefinePlugin } = require('webpack');
const { execSync } = require('child_process');
const { join } = require('path');

// Kurze Commit-ID als Build-Nummer, mit "-dirty", wenn apps/ oder libs/ uncommittete Änderungen haben.
function buildCommit() {
  const cwd = join(__dirname, '../..');
  try {
    const hash = execSync('git rev-parse --short HEAD', { cwd }).toString().trim();
    const dirty = execSync('git status --porcelain -- apps libs', { cwd }).toString().trim() !== '';
    return dirty ? `${hash}-dirty` : hash;
  } catch {
    return 'unbekannt';
  }
}

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
  },
  plugins: [
    new NxWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      generatePackageJson: true,
      optimization: false,
      outputHashing: 'none',
    }),
    new DefinePlugin({
      __BUILD_COMMIT__: JSON.stringify(buildCommit()),
    }),
  ],
};

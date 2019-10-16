module.exports = {
  name: 'worlds',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/worlds',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};

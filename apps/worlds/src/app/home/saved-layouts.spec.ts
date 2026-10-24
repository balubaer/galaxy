import { listSavedLayouts, parseSaveKey } from './saved-layouts';

describe('saved-layouts', () => {
  it('zerlegt einen Save-Schlüssel', () => {
    expect(parseSaveKey('R3W12D2.ZAPHOD')).toEqual({
      key: 'R3W12D2.ZAPHOD',
      round: 3,
      world: 12,
      distanceLevel: 2,
      user: 'ZAPHOD',
    });
    expect(parseSaveKey('currentUser')).toBeNull();
  });

  it('listet nur Saves des Benutzers, neueste Runde zuerst', () => {
    const keys = ['R1W5D3.ZAPHOD', 'currentUser', 'R2W7D3.ZAPHOD', 'R2W3D1.ARTHUR', 'R2W3D2.ZAPHOD'];
    expect(listSavedLayouts(keys, 'ZAPHOD').map((save) => save.key)).toEqual([
      'R2W3D2.ZAPHOD',
      'R2W7D3.ZAPHOD',
      'R1W5D3.ZAPHOD',
    ]);
  });
});

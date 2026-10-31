import { Node } from '@galaxy/api-interfaces';
import { worldArtifacts } from './command-panel.component';

describe('worldArtifacts', () => {
  const node = (): Node => ({
    id: 'W1',
    data: {
      classic: { artifacts: [{ number: 3, name: 'Holy Grail', type: 51 }] },
      fleets: [
        { label: 'F1=5', artifacts: [{ number: 4, name: 'Cursed Grail', type: 87 }] },
        { label: 'F2=5' },
      ],
    },
  });

  it('counts artifacts on the world and its fleets with the points for the own character', () => {
    const result = worldArtifacts(node(), 'missionary');
    expect(result?.count).toBe(2);
    expect(result?.points).toBe(5);
    expect(result?.title).toContain('• V3 Holy Grail: +15 Punkte/Runde – dein größter Schatz');
    expect(result?.title).toContain('• F1: V4 Cursed Grail: -10 Punkte/Runde');
  });

  it('has no points without a character and is null without artifacts', () => {
    expect(worldArtifacts(node(), null)?.points).toBeNull();
    expect(worldArtifacts({ id: 'W2', data: { classic: {}, fleets: [] } }, 'raider')).toBeNull();
  });
});

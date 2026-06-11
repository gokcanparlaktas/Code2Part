import {
  resolveTargetSpoolTokenByPortState,
} from '@/domain/categories/hydraulicValve/resolveSpoolTokenByPortState';

describe('resolveSpoolTokenByPortState', () => {
  it('Rexroth E → Yuken ordering code via portState/canonical', () => {
    expect(resolveTargetSpoolTokenByPortState('rexroth', 'E', 'yuken')).toBe('3C2');
  });

  it('Yuken 3C2 → Rexroth E via portState/canonical', () => {
    expect(resolveTargetSpoolTokenByPortState('yuken', '3C2', 'rexroth')).toBe('E');
  });

  it('Vickers 2A → Yuken 3C2 via portState/canonical', () => {
    expect(resolveTargetSpoolTokenByPortState('vickers', '2A', 'yuken')).toBe('3C2');
  });

  it('Rexroth F → Yuken 3C9 when catalog portState aligns', () => {
    expect(resolveTargetSpoolTokenByPortState('rexroth', 'F', 'yuken')).toBe('3C9');
  });

  it('Yuken 3C9 → Rexroth C46 when soft transition ordering applies', () => {
    expect(resolveTargetSpoolTokenByPortState('yuken', '3C9', 'rexroth')).toBe('C46');
  });

  it('Rexroth C46 → Yuken via portState/canonical', () => {
    expect(resolveTargetSpoolTokenByPortState('rexroth', 'C46', 'yuken')).toBeTruthy();
  });
});

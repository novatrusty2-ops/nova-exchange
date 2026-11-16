import { ServiceUnavailableException } from '@nestjs/common';
import { VaultSwapService } from './vault-swap.service';

jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });

const live = (block: number) => ({ status: 'LIVE', blockNumber: block, warnings: ['existing warning'] });

function makeService(reads: Array<() => Promise<any>>) {
  const svc = new VaultSwapService();
  jest.spyOn((svc as any).logger, 'warn').mockImplementation(() => undefined);
  jest.spyOn((svc as any).logger, 'error').mockImplementation(() => undefined);
  const readReserves = jest.spyOn(svc as any, 'readReserves');
  for (const r of reads) readReserves.mockImplementationOnce(r);
  return { svc, readReserves };
}

// getVaultReserves waits 1 s between attempts; advance fake time while it runs.
async function run(svc: VaultSwapService) {
  const p = svc.getVaultReserves();
  p.catch(() => undefined);
  await jest.advanceTimersByTimeAsync(1_500);
  return p;
}

describe('VaultSwapService.getVaultReserves', () => {
  it('returns a live read', async () => {
    const { svc, readReserves } = makeService([async () => live(100)]);
    await expect(run(svc)).resolves.toMatchObject({ status: 'LIVE', blockNumber: 100 });
    expect(readReserves).toHaveBeenCalledTimes(1);
  });

  it('retries once after a timeout', async () => {
    const { svc, readReserves } = makeService([async () => Promise.reject(new Error('request timeout')), async () => live(101)]);
    await expect(run(svc)).resolves.toMatchObject({ status: 'LIVE', blockNumber: 101 });
    expect(readReserves).toHaveBeenCalledTimes(2);
  });

  it('serves the last good read marked STALE when both attempts fail', async () => {
    const fail = async () => Promise.reject(new Error('request timeout'));
    const { svc } = makeService([async () => live(102), fail, fail]);
    await run(svc);
    jest.advanceTimersByTime(60_000); // past the 30 s cache
    const r = await run(svc);
    expect(r.status).toBe('STALE');
    expect(r.blockNumber).toBe(102);
    expect(r.staleSeconds).toBeGreaterThanOrEqual(60);
    expect(r.warnings).toEqual(['existing warning', expect.stringContaining('Alltra RPC unavailable')]);
  });

  it('fails with 503 when both attempts fail and nothing was read before', async () => {
    const fail = async () => Promise.reject(new Error('request timeout'));
    const { svc } = makeService([fail, fail]);
    await expect(run(svc)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('does not serve data older than 10 minutes', async () => {
    const fail = async () => Promise.reject(new Error('request timeout'));
    const { svc } = makeService([async () => live(103), fail, fail]);
    await run(svc);
    jest.advanceTimersByTime(11 * 60_000);
    await expect(run(svc)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

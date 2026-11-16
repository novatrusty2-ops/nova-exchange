import axios from 'axios';
import { NovaBankService } from './nova-bank.service';

jest.mock('axios');
const request = axios.request as jest.Mock;

const unreachable = () => Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
const rejected = (status: number, data: unknown) => Object.assign(new Error(`status ${status}`), { response: { status, data } });

function service(apiKey: string | null = 'test-key') {
  if (apiKey === null) delete process.env.NOVA_BANK_API_KEY;
  else process.env.NOVA_BANK_API_KEY = apiKey;
  return new NovaBankService();
}

beforeEach(() => request.mockReset());
afterAll(() => delete process.env.NOVA_BANK_API_KEY);

describe('NovaBankService without an API key', () => {
  it('never calls the bank and reports not configured on every endpoint', async () => {
    const s = service(null);
    const reserves = await s.getAccountReserves('6572');
    const ledger = await s.getLedgerBridgeStatus();
    const settle = await s.settleLedgerBridge({ amount: '100' });

    expect(request).not.toHaveBeenCalled();
    expect(reserves).toMatchObject({ success: true, verified: false, status: 'declared, not verified' });
    expect(reserves.bankApi).toMatch(/not configured/);
    expect(ledger).toMatchObject({ success: false, status: 'unavailable', ready: false, sources: [] });
    expect(settle).toMatchObject({ success: false, settled: false, status: 'not_settled' });
  });
});

describe('getAccountReserves', () => {
  it('is verified only when the bank says isVerified: true', async () => {
    request.mockResolvedValueOnce({ data: { isVerified: true, balance: 5 } });
    await expect(service().getAccountReserves('6572')).resolves.toMatchObject({ verified: true, status: 'verified by bank API' });
  });

  it('is not verified when the bank omits isVerified', async () => {
    request.mockResolvedValueOnce({ data: { balance: 5 } });
    const r = await service().getAccountReserves('6572');
    expect(r.verified).toBe(false);
    expect(r.status).toBe('reported by bank API, not verified');
  });

  it('falls back to declared figures, marked unverified, when the bank is unreachable', async () => {
    request.mockRejectedValueOnce(unreachable());
    const r: any = await service().getAccountReserves('6572');
    expect(r).toMatchObject({ success: true, verified: false, status: 'declared, not verified' });
    expect(r.bankApi).toMatch(/unreachable/);
    expect(r.pools).toBeDefined(); // from config.js
  });

  it('sends the API key as a bearer token', async () => {
    request.mockResolvedValueOnce({ data: {} });
    await service('abc').getAccountReserves('6572');
    expect(request.mock.calls[0][0].headers.Authorization).toBe('Bearer abc');
  });
});

describe('getLedgerBridgeStatus', () => {
  it('passes bank data through when reachable', async () => {
    request.mockResolvedValueOnce({ data: { ready: true } });
    await expect(service().getLedgerBridgeStatus()).resolves.toMatchObject({ success: true, data: { ready: true } });
  });

  it('reports unavailable with no invented balances when unreachable', async () => {
    request.mockRejectedValueOnce(unreachable());
    const r: any = await service().getLedgerBridgeStatus();
    expect(r).toMatchObject({ success: false, ready: false, sources: [], actionsSupported: [] });
    expect(JSON.stringify(r)).not.toMatch(/000,000/);
  });
});

describe('settleLedgerBridge', () => {
  it('is settled only when the bank accepts it', async () => {
    request.mockResolvedValueOnce({ data: { id: 'tx1' } });
    await expect(service().settleLedgerBridge({ amount: '1' })).resolves.toMatchObject({ success: true, settled: true, result: { id: 'tx1' } });
  });

  it('reports not_settled when the bank is unreachable', async () => {
    request.mockRejectedValueOnce(unreachable());
    const r: any = await service().settleLedgerBridge({ amount: '1' });
    expect(r).toMatchObject({ success: false, settled: false, status: 'not_settled' });
    expect(r.message).toMatch(/^Nothing was settled/);
  });

  it('reports rejected with the bank status and error when the bank refuses', async () => {
    request.mockRejectedValueOnce(rejected(422, { error: 'insufficient funds' }));
    const r: any = await service().settleLedgerBridge({ amount: '1' });
    expect(r).toMatchObject({ success: false, settled: false, status: 'rejected', bankHttpStatus: 422, bankError: { error: 'insufficient funds' } });
  });
});

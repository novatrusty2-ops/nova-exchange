import { RpcController } from './rpc.controller';

const realFetch = global.fetch;
const fetchMock = jest.fn();

const reply = (json: unknown, status = 200) => Promise.resolve({ ok: status < 400, status, json: async () => json } as Response);
const call = (method: string, params: unknown[] = []) => ({ jsonrpc: '2.0', id: 7, method, params });

let rpc: RpcController;

beforeAll(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterAll(() => {
  global.fetch = realFetch;
});
beforeEach(() => {
  fetchMock.mockReset();
  rpc = new RpcController();
  jest.spyOn((rpc as any).logger, 'warn').mockImplementation(() => undefined);
  jest.spyOn((rpc as any).logger, 'error').mockImplementation(() => undefined);
});

describe('RpcController', () => {
  it('forwards eth_chainId to the upstream node instead of answering locally', async () => {
    fetchMock.mockReturnValueOnce(reply({ jsonrpc: '2.0', id: 7, result: '0x5600' }));
    await expect(rpc.handleNovaXRpc(call('eth_chainId'))).resolves.toEqual({ jsonrpc: '2.0', id: 7, result: '0x5600' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ method: 'eth_chainId', id: 7 });
  });

  it('reports eth_chainId as unavailable when the upstream is down', async () => {
    fetchMock.mockReturnValueOnce(reply('<html>404</html>', 404));
    const r: any = await rpc.handleNovaXRpc(call('eth_chainId'));
    expect(r.result).toBeUndefined();
    expect(r.error).toMatchObject({ code: -32603, message: 'Upstream RPC for chain 22016 is unavailable' });
  });

  it('reports a network error as unavailable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const r: any = await rpc.handleNovaPlusRpc(call('eth_blockNumber'));
    expect(r.error.message).toBe('Upstream RPC for chain 33001 is unavailable');
  });

  it('rejects an upstream that is on a different chain', async () => {
    fetchMock.mockReturnValueOnce(reply({ jsonrpc: '2.0', id: 7, result: '0x7a69' })); // 31337, a local Hardhat node
    const r: any = await rpc.handleNovaPlusRpc(call('eth_chainId'));
    expect(r.result).toBeUndefined();
    expect(r.error.message).toBe('Upstream RPC is on chain 31337, expected 33001');
  });

  it('passes read-only results through unchanged', async () => {
    fetchMock.mockReturnValueOnce(reply({ jsonrpc: '2.0', id: 7, result: '0x10' }));
    await expect(rpc.handleNovaXRpc(call('eth_blockNumber'))).resolves.toEqual({ jsonrpc: '2.0', id: 7, result: '0x10' });
  });

  it('refuses methods that are not read-only without contacting the upstream', async () => {
    const r: any = await rpc.handleNovaXRpc(call('eth_sendRawTransaction', ['0xdead']));
    expect(r.error).toMatchObject({ code: -32601 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

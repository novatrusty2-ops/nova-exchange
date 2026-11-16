import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as path from 'path';

// Every method resolves (so the controller always answers HTTP 200), but the body states what really
// happened: `success` / `verified` / `settled` are only true when the bank API explicitly confirmed it.
// When the bank API is not configured or unreachable, nothing is invented or simulated.

// Single shape (not a union): this project builds with strictNullChecks off, which disables union narrowing.
interface BankCall<T> {
  ok: boolean;
  data?: T;
  reason?: string;
  bankHttpStatus?: number;
  bankError?: unknown;
}

@Injectable()
export class NovaBankService {
  private readonly logger = new Logger(NovaBankService.name);
  private readonly apiUrl = process.env.NOVA_BANK_API_URL || 'https://api.novabank.uk/v1';
  private readonly apiKey = process.env.NOVA_BANK_API_KEY;
  private readonly timeoutMs = Number(process.env.NOVA_BANK_TIMEOUT_MS) || 5000;

  private async call<T = any>(method: 'get' | 'post', endpoint: string, body?: unknown): Promise<BankCall<T>> {
    if (!this.apiKey) return { ok: false, reason: 'bank API key not configured (NOVA_BANK_API_KEY)' };
    try {
      const response = await axios.request<T>({
        method,
        url: `${this.apiUrl}${endpoint}`,
        data: body,
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        timeout: this.timeoutMs,
      });
      return { ok: true, data: response.data };
    } catch (error: any) {
      if (error.response) {
        // The bank answered but refused the request.
        return { ok: false, reason: 'bank API rejected the request', bankHttpStatus: error.response.status, bankError: error.response.data };
      }
      this.logger.warn(`Bank API ${method.toUpperCase()} ${endpoint} unreachable: ${error.message}`);
      return { ok: false, reason: `bank API unreachable: ${error.code || error.message}` };
    }
  }

  private declaredReserves() {
    try {
      const configPath = path.resolve(__dirname, '../config.js');
      delete require.cache[require.resolve(configPath)];
      return require(configPath).reserves;
    } catch (e: any) {
      return { error: `config.js unavailable: ${e.message}` };
    }
  }

  async getAccountReserves(accountNumber: string) {
    const bank = await this.call(`get`, `/accounts/${encodeURIComponent(accountNumber)}`);
    if (bank.ok) {
      const data: any = bank.data ?? {};
      const verified = data.isVerified === true;
      return {
        success: true,
        account: accountNumber,
        source: 'Nova Online Bank / Core Ledger',
        bankApi: 'reachable',
        status: verified ? 'verified by bank API' : data.status || 'reported by bank API, not verified',
        verified,
        balances: data,
      };
    }
    // Bank not reachable: show the declared figures from config.js, explicitly marked unverified.
    return {
      success: true,
      account: accountNumber,
      bankApi: bank.reason,
      ...this.declaredReserves(),
      status: 'declared, not verified',
      verified: false,
    };
  }

  async getLedgerBridgeStatus() {
    const bank = await this.call('get', '/ledger-bridge/status');
    if (bank.ok) {
      return { success: true, source: 'Nova Online Bank / Ledger Bridge', bankApi: 'reachable', data: bank.data };
    }
    return {
      success: false,
      source: 'Nova Online Bank / Ledger Bridge',
      bankApi: bank.reason,
      status: 'unavailable',
      ready: false,
      sources: [],
      actionsSupported: [],
      ...(bank.bankHttpStatus ? { bankHttpStatus: bank.bankHttpStatus, bankError: bank.bankError } : {}),
    };
  }

  async settleLedgerBridge(settlementData: any) {
    const bank = await this.call('post', '/ledger-bridge/settle', settlementData);
    if (bank.ok) {
      return { success: true, settled: true, source: 'Nova Online Bank / Ledger Bridge', status: 'settled by bank API', result: bank.data };
    }
    return {
      success: false,
      settled: false,
      source: 'Nova Online Bank / Ledger Bridge',
      status: bank.bankHttpStatus ? 'rejected' : 'not_settled',
      message: `Nothing was settled: ${bank.reason}.`,
      timestamp: new Date().toISOString(),
      ...(bank.bankHttpStatus ? { bankHttpStatus: bank.bankHttpStatus, bankError: bank.bankError } : {}),
    };
  }
}

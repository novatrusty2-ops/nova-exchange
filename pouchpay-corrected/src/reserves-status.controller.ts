import { Controller, Get, Post, Body, HttpCode } from '@nestjs/common';
import { NovaBankService } from './nova-bank.service';

@Controller()
export class ReservesStatusController {
  constructor(private readonly novaBankService: NovaBankService) {}

  @Get(['reserves/status', 'api/v1/reserves/status'])
  async getReservesStatus() {
    return this.novaBankService.getAccountReserves('6572');
  }

  @Get(['ledger-bridge/status', 'api/v1/ledger-bridge/status'])
  async getLedgerBridgeStatus() {
    return this.novaBankService.getLedgerBridgeStatus();
  }

  // Always HTTP 200; read `settled` in the body to know whether anything was actually settled.
  @Post(['ledger-bridge/settle', 'api/v1/ledger-bridge/settle'])
  @HttpCode(200)
  async settleLedgerBridge(@Body() settlementData: any) {
    return this.novaBankService.settleLedgerBridge(settlementData);
  }
}

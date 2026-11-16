// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NovaReserveVerifier is Ownable {
    /// @dev Pass this as `token` to check a vault's native ETH balance instead of an ERC-20.
    address public constant NATIVE = address(0);

    uint256 public totalReserves;

    event ReservesUpdated(uint256 newTotal, address indexed updater);

    error NotATokenContract(address token);

    constructor() Ownable(msg.sender) {}

    function updateReserves(uint256 _amount) external onlyOwner {
        totalReserves = _amount;
        emit ReservesUpdated(_amount, msg.sender);
    }

    /// @notice Current on-chain balance of `_vault`: native ETH when `_token` is NATIVE, otherwise the ERC-20 `balanceOf`.
    function vaultBalance(address _token, address _vault) public view returns (uint256) {
        if (_token == NATIVE) return _vault.balance;
        if (_token.code.length == 0) revert NotATokenContract(_token);
        return IERC20(_token).balanceOf(_vault);
    }

    /// @notice True when `_vault` currently holds at least `_expectedBalance` of `_token` (read live, not stored).
    function verifyVaultBalance(address _token, address _vault, uint256 _expectedBalance) external view returns (bool) {
        return vaultBalance(_token, _vault) >= _expectedBalance;
    }
}

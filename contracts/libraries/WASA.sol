// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;

import "openzeppelin6/access/Ownable.sol";

import "./ARC20.sol";

contract WASA is ARC20("Wrapped Astra", "WASA") {
    event Deposit(address indexed dst, uint256 wad);
    event Withdrawal(address indexed src, uint256 wad);

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        _balances[msg.sender] = _balances[msg.sender].add(msg.value);
        Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 wad) public {
        require(balanceOf(msg.sender) >= wad);
        _balances[msg.sender] = _balances[msg.sender].sub(wad);
        msg.sender.transfer(wad);
        Withdrawal(msg.sender, wad);
    }
}
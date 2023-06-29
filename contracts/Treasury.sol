// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "openzeppelin6/access/Ownable.sol";

contract Treasury is Ownable {
    receive() external payable {}

    function claim(address payable _to, uint256 _amount) external onlyOwner {
        uint256 asaBal = address(this).balance;
        if (_amount > asaBal) {
            _to.transfer(asaBal);
        } else {
            _to.transfer(_amount);
        }
    }

    function emergencyWithdraw(address payable _to) external onlyOwner {
        uint256 asaBal = address(this).balance;
        _to.transfer(asaBal);
    }
}

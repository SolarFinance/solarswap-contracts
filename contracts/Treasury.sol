// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "openzeppelin6/access/Ownable.sol";

contract Treasury is Ownable {
    receive() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function claim(address payable _to, uint256 _amount)
        public
        payable
        onlyOwner
    {
        require(getBalance() >= _amount, "Insufficient Astra to claim");
        _to.transfer(_amount);
    }
}

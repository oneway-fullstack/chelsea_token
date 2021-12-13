pragma solidity ^0.8.10;

import "./ChelseaToken.sol";

contract ChelseaTokenSale{
  address admin;
  ChelseaToken public tokenContract;
  uint256 public tokenPrice;
  uint256 public tokensSold;

  event Sell(address _buyer, uint256 _amount);

  constructor(ChelseaToken _tokenContract, uint256 _tokenPrice) public {
    // Assign an admin
    admin = msg.sender;
    // Token Contract
    tokenContract = _tokenContract;
    // Token Price
    tokenPrice = _tokenPrice;
  }
  // multiply
  function multiply(uint256 x, uint256 y) internal pure returns (uint256 z) {
    require(y == 0 || (z = x * y) / y == x);
  }

  // Buying Tokens
  function buyTokens(uint256 _numberOfTokens) public payable{
    // Require that value is equal to tokens
    require(msg.value == multiply(_numberOfTokens, tokenPrice));
    // Require that the contract has enough tokens
    require(tokenContract.balanceOf(address(this)) >= _numberOfTokens);
    // Require that a transfer is successful
    require(tokenContract.transfer(msg.sender, _numberOfTokens));
    // Keep tracksSold
    tokensSold += _numberOfTokens;
    // Trigger Sell Event
    emit Sell(msg.sender, _numberOfTokens);
  }

  // Ending Token - ChelseaTokenSale
  function endSale() public {
    // Require that admin can do
    require(msg.sender == admin);
    // Transfer remiaing tokens to admin
    require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))));
    // Destory contract
    address payable addr = payable(address(admin));
    // selfdestruct(addr);
    addr.transfer(address(this).balance);
  }
}
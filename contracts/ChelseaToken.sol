pragma solidity ^0.8.10;

contract ChelseaToken {  
  // Name
  string public name = "Chelsea Token";
  // Symbol
  string public symbol = 'CHELSEA';
  // Standard
  string public standard = "Chelsea Token v1.0";
  // Total Supply
  uint256 public totalSupply;
  // Balance
  mapping(address => uint256) public balanceOf;  
  // Allowance
  mapping(address => mapping(address => uint256)) public allowance;

  // Event
  event Transfer(
    address indexed _from,
    address indexed _to,
    uint256 _value
  );

  event Approval(
    address indexed _owner,
    address indexed _spender,
    uint256 _value
  );

  constructor (uint256 _initalSupply) public{
    balanceOf[msg.sender] = _initalSupply;
    totalSupply  = _initalSupply;    
  }

  // Transfer  
  function transfer(address _to, uint256 _value) public returns (bool success) {
    // Exception if account doesn't have enough
    require(balanceOf[msg.sender] >= _value);
    // Transfer the balance
    balanceOf[msg.sender] -= _value;
    balanceOf[_to] += _value;
    // Transfer Event: MUST trigger when tokens are transfered, including zero value transfers.
    emit Transfer(msg.sender, _to, _value);
    // Return a boolean
    success = true;
    return success;
  }  

  // Delegated Transfer
  // Approve
  function approve(address _spender, uint256 _value) public returns (bool success) {
    // Allowance
    allowance[msg.sender][_spender] = _value;
    // Approve event
    emit Approval(msg.sender, _spender, _value);
    success = true;
    return success;
  }

  // transferFrom
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
    // Require _from account has enough tokens
    require(_value <= balanceOf[_from]);
    // Require allowance is big enough
    require(_value <= allowance[_from][msg.sender]);

    // Change the balance
    balanceOf[_from] -= _value;
    balanceOf[_to] += _value;

    // Update the allowance
    allowance[_from][msg.sender] -= _value;
    // Transfer vevent
    emit Transfer(_from, _to, _value);
    success = true;
    return success;
  }
}














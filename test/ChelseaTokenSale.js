const ChelseaTokenSale = artifacts.require("ChelseaTokenSale");
const ChelseaToken = artifacts.require("ChelseaToken");

contract('ChelseaTokenSale', function(accounts) {
  var tokenSaleInstance;  
  var tokenInstance;
  var tokenPrice = 1000000000000000; // in wei (0.001ETH)
  var admin = accounts[0];
  const buyer = accounts[1];
  var tokensAvailable = 7500;
  var numberOfTokens = 10;

  it('initializes the contract with the correct, value', function(){
    return ChelseaTokenSale.deployed().then(function(instance) {
      tokenSaleInstance = instance;
      return tokenSaleInstance.address
    }).then(function(address) {
      assert.notEqual(address, 0x0, 'has the contract address');      
      return tokenSaleInstance.tokenContract();
    }).then(function(address){
      assert.notEqual(address, 0x0, 'has token contract address');            
      return tokenSaleInstance.tokenPrice();
    }).then(function(price){
      assert.equal(price.toNumber(), tokenPrice, 'token price is correct');
    });
  });

  it('faciliates token buying', function(){
    return ChelseaToken.deployed().then(function(instance){
      // Grab token instance first
      tokenInstance = instance;
      return ChelseaTokenSale.deployed();
    }).then(function(instance) {
      // Then grab token sale instance
      tokenSaleInstance = instance;   
      // Provision 75% of all tokens to the token sale
      return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, {
        from :admin
      })
    }).then(function(receipt) {
      var value = numberOfTokens * tokenPrice;
      return tokenSaleInstance.buyTokens(numberOfTokens,{
        from: buyer,
        value: value
      });
    }).then(function(receipt) {      
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
      assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens')        
      assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased')
      return tokenSaleInstance.tokensSold();
    }).then(function(amount) {
      assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');
      return tokenInstance.balanceOf(buyer);
    }).then (function(balance){
      assert.equal(balance.toNumber(), numberOfTokens);    
      return tokenInstance.balanceOf(tokenSaleInstance.address);
    }).then(function(balance){
      assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
      // Try to buy tokens different from ether value
      return tokenSaleInstance.buyTokens(numberOfTokens, {
        from: buyer,
        value: 1
      })
    }).then(assert.fail).catch(function(error){
      assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');      
      return tokenSaleInstance.buyTokens(8000, {
        from: buyer,
        value: numberOfTokens * tokenPrice
      });
    }).then(assert.fail).catch(function(error){
      assert(error.message.indexOf('revert') >= 0, 'cannot purchase more tokens than available');      
    });
  });

  it('ends token sale', function(){
    return ChelseaToken.deployed().then(function(instance){
      // Grab token instance first
      tokenInstance = instance;
      return ChelseaTokenSale.deployed();
    }).then(function(instance) {
      // Then grab token sale instance
      tokenSaleInstance = instance;         
      // Try end sale from account toher than the admin
      return tokenSaleInstance.endSale({
        from: buyer
      });
    }).then(assert.fail).catch(function(error){
      assert(error.message.indexOf('revert') >=0, 'must be admin to the end sale.')
      // End sale as admin
      return tokenSaleInstance.endSale({
        from: admin
      })
    }).then(function(receipt){
      // receipt
      return tokenInstance.balanceOf(admin);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 9990, 'returns all unsold tokens to admin');
      // Check that token price was reset when selfDestruct was called
      return tokenSaleInstance.tokenPrice();
    }).then(function(price) {
      assert.equal(price.toNumber(), 1000000000000000, 'token price was reset');
    });
  });
})
var ChelseaToken = artifacts.require("ChelseaToken");
var ChelseaTokenSale = artifacts.require("ChelseaTokenSale");

module.exports = function (deployer) {
  deployer.deploy(ChelseaToken, 10000).then(function(){
    // Token price is 0.001 Ether
    const tokenPrice = 1000000000000000;
    return deployer.deploy(ChelseaTokenSale, ChelseaToken.address, tokenPrice);
  });  
};

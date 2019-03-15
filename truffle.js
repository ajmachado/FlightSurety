var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
//var mnemonic = "deer aisle other found wrist never winner hill film token mad ecology";
module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:9545/", 0, 50);
      },
      network_id: '*',
      gas: 9999999
      
      /*  host: "127.0.0.1",
        port: 9545,
        network_id: '*',
        gas: 9999999
     */
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};
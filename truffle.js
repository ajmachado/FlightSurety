var HDWalletProvider = require("truffle-hdwallet-provider");
//var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
var mnemonic = "toss rate level more always expand awake comic second fish casino radio";
module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: '*',
      gas: 6721975
      
      /*  host: "127.0.0.1",
        port: 9545,
        network_id: '*',
        gas: 99999999
        gas: 4612388
     */
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};
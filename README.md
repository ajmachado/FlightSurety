# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Version Info

Truffle v4.1.14 (core: 4.1.14)

Solidity v0.4.24 (solc-js)

Ganache CLI v6.2.5 (ganache-core: 2.3.3)

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`

`truffle compile`

## Develop Client

### Tests
To run truffle tests:
Start Ganache CLI in the terminal using

`ganache-cli -p 8545 -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat" -a 45 -l 80000000000`

To run truffle tests:

In a second terminal window run the following commands

`truffle test ./test/flightSurety_1.js`

`truffle test ./test/flightSurety_2.js`

`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`

`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`

`truffle test ./test/oracles.js`

## Test Dapp

In terminal run

`truffle compile`
`truffle migrate --reset`

In second terminal run

`npm run dapp`

In third terminal run

`npm run server2` -- For Windows
OR
`npm run server` -- For Mac/Linux

In your browser open

`http://localhost:8000`

The Operating status of the App is displayed on top

1. The first airline is registered and funded by default in the App. You can fund the rest of the airlines in the 'Airline Section'.

2. In the passenger section you can

    1. Purchase flight Insurance by selecting the flight from the dropdown.
    
    2. Check flight status and claim Insurance.
    
    3. Check Insurance credit issued by the App.
    
    4. Check the account balance.
    
    5. Withdraw the Insurance credits.

## Deploy

To build dapp for prod:

`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)

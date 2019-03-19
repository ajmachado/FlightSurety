
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
       
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

   it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    
    let status = await config.flightSuretyData.isOperational.call();
    
    assert.equal(status, true, "Incorrect initial operating status value");
    
  });

   it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: accounts[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.owner });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

     
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false, { from: config.owner });
        
      let reverted = false;
      try 
      {
          await config.flightSuretyData.testFunction({ from: config.firstAirline });
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      reverted = false;
      try {
        await config.flightSuretyData.setOperatingStatus(true);
      }catch(e) {
        reverted = true;
      }
      assert.equal(reverted, false, "Reset operational status failed");
  });

  it('(airline) can register an Airline using registerAirline() if it is funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];
    
    let reverted = false;
    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {
      reverted = true;
    }
    let result = await config.flightSuretyData.isRegistered.call(newAirline); 

    // ASSERT
    assert.equal(result, true, "Airline should be able to register another airline if it has been funded");
    assert.equal(reverted, false, "Airline should be able to register another airline if it has been funded");

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[3];

    let reverted = false;
    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: accounts[2]});
    }
    catch(e) {
      reverted = true;
    }
    let result = await config.flightSuretyData.isRegistered.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) airline is funded with 10 ETH. Use fund() function', async () => {
    
    // ARRANGE
    let airline = accounts[2];
    
    const payment  = web3.toWei("10", "ether");
    //console.log(config.weiMultiple.toNumber());
    
    // ACT
    let revert = false;
    try {
        await config.flightSuretyApp.fund(airline, {from: airline, value: payment.toString(), gasPrice:0});
    }
    catch(e) {
      revert = true;
      //console.log(e);
    }
    let result = await config.flightSuretyData.isFunded.call(airline); 
    // ASSERT
    assert.equal(result, true, "Airline not funded.");
    assert.equal(revert, false, "Airline not funded.");
  });

  it('(airline) airline needs minimum 10 ETH to be funded. Use fund() function', async () => {
    
    // ARRANGE
    let airline = accounts[3];
    let reverted = false;
    // ACT
    try {
        await config.flightSuretyApp.fund(airline, {from: airline, value: config.weiLow.toNumber()});
    }
    catch(e) {
      //console.log(e);
      reverted = true;
    }
    //let result = await config.flightSuretyData.isFunded.call(airline); 

    // ASSERT
    //assert.equal(result, false, "Low funding. Requires 10 ETH.");
    assert.equal(reverted, true, "Low funding. Error.");
  });

  it('(airline) Register first 4 airlines without consensus', async () => {
    
    // ARRANGE
    let airline = accounts[2];
    let airline3 = accounts[3];
    let airline4 = accounts[4];
    
    
    // ACT
    try {
        await config.flightSuretyApp.registerAirline(airline3, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(airline4, {from: config.firstAirline});
        //let contractBalance = await config.flightSuretyData.contractBalance.call();
    }
    catch(e) {

    }
    let result1 = await config.flightSuretyData.isRegistered.call(airline3); 
    let result2 = await config.flightSuretyData.isRegistered.call(airline4); 
    // ASSERT
    assert.equal(result1, true, "Airline 3 cannot be registered.");
    assert.equal(result2, true, "Airline 4 cannot be registered.");

    
  });

  it('(airline) Fund first 4 airlines without consensus', async () => {
    
    // ARRANGE
    let airline = accounts[2];
    let airline3 = accounts[3];
    let airline4 = accounts[4];
    
    const payment  = web3.toWei("10", "ether")
    // ACT
    let reverted = false;
    try {
        await config.flightSuretyApp.fund(airline3, {from: airline3, value: payment.toString(), gasPrice: 0});
        await config.flightSuretyApp.fund(airline4, {from: airline4, value: payment.toString(), gasPrice: 0});
        //let contractBalance = await config.flightSuretyData.contractBalance.call();
    }
    catch(e) {
      reverted = true;
      //console.log(e)
    }
    let result3 = await config.flightSuretyData.isFunded.call(airline3); 
    let result4 = await config.flightSuretyData.isFunded.call(airline4); 
    // ASSERT
    assert.equal(result3, true, "Airline 3 cannot be funded.");
    assert.equal(result4, true, "Airline 4 cannot be funded.");

  });
 
  it('(airline) Register 5th airline. Test Consensus - Fail', async () => {
    
    // ARRANGE
    let airline1 = config.firstAirline;
    let airline2 = accounts[2];
    let airline3 = accounts[3];
    let airline4 = accounts[4];
    let airline5 = accounts[5];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(airline5, {from: airline1});
    }
    catch(e) {
        console.log(e);
    }
    let result = await config.flightSuretyData.isRegistered.call(airline5); 

    // ASSERT
    assert.equal(result, false, "5th Airline cannot be added without consensus");

  });

  it('(airline) Register 5th airline. Test Consensus - Register', async () => {
    
    // ARRANGE
    let airline1 = config.firstAirline;
    let airline2 = accounts[2];
    let airline3 = accounts[4];
    let airline4 = accounts[5];
    let airline5 = accounts[6];
    // ACT
    try {
        await config.flightSuretyApp.registerAirline(airline5, {from: airline2});
        await config.flightSuretyApp.registerAirline(airline5, {from: airline3});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isRegistered.call(airline5); 
   

    // ASSERT
    assert.equal(result, true, "Error adding 5th Airline with consensus");

  });

  it('(flight) Register Flight', async () => {
    
    // ARRANGE
    
    let airline = accounts[2];
    let flightNumber = "UA141";
    let time = Math.floor((Date.now() + 43200)/ 1000);
    
    // ACT
    try {
        await config.flightSuretyApp.registerFlight(time, airline, flightNumber, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyApp.isFlightRegistered.call(airline, flightNumber, time); 
   

    // ASSERT
    assert.equal(result, true, "Flight could not be registered");

  });

  it('(flight) Re - Register same Flight', async () => {
    
    // ARRANGE
    
    let airline = accounts[2];
    let flightNumber = "UA141";
    let time = Math.floor((Date.now() + 43200)/ 1000);
    
    let revert = false
    // ACT
    try {
        await config.flightSuretyApp.registerFlight(time, airline, flightNumber, {from: airline});
    }
    catch(e) {
        revert = true
    }
    
    // ASSERT
    assert.equal(revert, true, "Flight could not be registered");

  });

  it('(passenger) Purchase flight Insurance 1 ETH', async () => {
    
    // ARRANGE
    
    let passenger = accounts[7];
    let airline = accounts[2];
    let flightNumber = "UA141";
    let time = Math.floor((Date.now() + 43200)/ 1000);
    const payment  = web3.toWei("1", "ether")
        
    // ACT
    try {
        await config.flightSuretyApp.insurePassenger(flightNumber, time, airline, passenger, {from: passenger, value: payment.toString(), gasPrice: 0});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isInsured.call(passenger, flightNumber); 
    
    // ASSERT
    assert.equal(result, true, "Passenger could not be insured");

  });

  it('(passenger) Purchase flight Insurance > 1 ETH', async () => {
    
    // ARRANGE
    
    let passenger = accounts[7];
    let airline = accounts[4];
    let flightNumber = "AA241";
    let time = Math.floor((Date.now() + 43200)/ 1000);
    const payment  = web3.toWei("2", "ether")
        
    let revert = false;
    // ACT
    try {
        await config.flightSuretyApp.insurePassenger(flightNumber, time, airline, passenger, {from: passenger, value: payment.toString(), gasPrice: 0});
    }
    catch(e) {
        revert = true;
    }
    //let result = await config.flightSuretyData.isInsured.call(passenger, flightNumber); 
    
    // ASSERT
    assert.equal(revert, true, "Passenger could not be insured");

  });

  it('(passenger) Trying to insure on same flight again', async () => {
    
    // ARRANGE
    
    let passenger = accounts[7];
    let airline = accounts[2];
    let flightNumber = "UA141";
    let time = Math.floor((Date.now() + 43200)/ 1000);
    const payment  = web3.toWei("1", "ether")
        
    let revert = false;
    // ACT
    try {
        await config.flightSuretyApp.insurePassenger(flightNumber, time, airline, passenger, {from: passenger, value: payment.toString(), gasPrice: 0});
    }
    catch(e) {
        revert = true;
    }
    //let result = await config.flightSuretyData.isInsured.call(passenger, flightNumber); 
    
    // ASSERT
    assert.equal(revert, true, "Passenger could not be insured");

  }); 
});

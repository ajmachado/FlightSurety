
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  let time = Math.floor((Date.now() + 43200)/ 1000);
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/
  it('(airline) airline is funded with 10 ETH. Use fund() function', async () => {
    
    // ARRANGE
    let payment  = web3.toWei("10", "ether").toString();
    try {
      await config.flightSuretyApp.fund({from: config.firstAirline, value: payment, gasPrice: 0, gas:230000});
    }
    catch(e) {
      console.log(e);
    }

    let airline = accounts[2];
    await config.flightSuretyApp.registerAirline(airline, {from: config.firstAirline});
    
    // ACT
    let revert = false;
    try {
        await config.flightSuretyApp.fund({from: airline, value: payment, gasPrice: 0, gas:230000});
    }
    catch(e) {
      revert = true;
      console.log(e);
    }
    let result = await config.flightSuretyData.isRegistered.call(airline); 
    // ASSERT
    assert.equal(result, true, "Airline not funded.");
    assert.equal(revert, false, "Airline not funded.");
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
        await config.flightSuretyApp.fund({from: airline3, value: payment.toString(), gasPrice: 0});
        await config.flightSuretyApp.fund({from: airline4, value: payment.toString(), gasPrice: 0});
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

   it('(airline) Register 5th airline. Test Consensus - Register', async () => {
    
    // ARRANGE
    let airline1 = config.firstAirline;
    let airline2 = accounts[2];
    let airline3 = accounts[3];
    let airline4 = accounts[4];
    let airline5 = accounts[6];
    // ACT
    let reverted = false;
    try {
        await config.flightSuretyApp.registerAirline(airline5, {from: airline3});
        await config.flightSuretyApp.registerAirline(airline5, {from: airline4});
    }
    catch(e) {
      //console.log(e)
      reverted = true;
    }
    let result = await config.flightSuretyData.isRegistered.call(airline5); 
   

    // ASSERT
    assert.equal(result, true, "Error adding 5th Airline with consensus");

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

   it('(airline) airline needs minimum 10 ETH to be funded. Use fund() function', async () => {
    
    // ARRANGE
    let airline = accounts[3];
    let reverted = false;
    // ACT
    try {
        await config.flightSuretyApp.fund({from: airline, value: config.weiLow.toNumber()});
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


  it('(flight) Register Flight', async () => {
    
    // ARRANGE
    
    let airline = accounts[2];
    let flightNumber = "UA141";
            
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

  it('(passenger) Credit Insuree if flight delayed by airline', async () => {
    
    // ARRANGE    
    let passenger = accounts[7];
    let flightNumber = "UA141";
    let airline = accounts[2];
    let regFee = await config.flightSuretyApp.REGISTRATION_FEE.call();
    let registeredOracles = []
    let res;
    let index
    let indexes = [];

    // ACT
    //Register Oracles
    for(var i = 10; i < 30; i++) {
      await config.flightSuretyApp.registerOracle({from: accounts[i], value: regFee});

      indexes = await config.flightSuretyApp.getMyIndexes({ from: accounts[i]});
      for( var j = 0; j < indexes.length; j++){
        indexes[j] = indexes[j].toNumber();
      }
      //console.log(indexes);
      registeredOracles.push([accounts[i], indexes]);
    }
    //console.log(registeredOracles);
    //Get index
    let tx = await config.flightSuretyApp.fetchFlightStatus(airline, flightNumber, time, {from: accounts[i]});
    truffleAssert.eventEmitted(tx, 'OracleRequest', (ev) => {
      index = ev.index.toNumber();
      return ev.index;
    });

    let count = 0;
    for (var j = 0; j < registeredOracles.length; j++) {
      indexes  = registeredOracles[j][1];
      if(indexes.indexOf(index) != -1) {
        try {
          await config.flightSuretyApp.submitOracleResponse(index, airline, flightNumber, time, 20, {from: registeredOracles[j][0]});
          count++;
        } catch (e) {
          console.log(e); 
        }
      }
      if(count == 3) break;
    }
    
    let result = await config.flightSuretyApp.getPassengerCredits(passenger, {from: passenger}); 
    result = result.toNumber();
    //console.log(result);
    let credited = false;
    if(result > 0) credited = true;
    
    // ASSERT
    assert.equal(credited, true, "Passenger could not be credited");
    //assert.equal(revert, false, "Flight Status could not be processed");
  });

  it('(passenger) Withdraw payout', async () => {
    
    // ARRANGE
    let passenger = accounts[7];
                
    let revert = false;

    let prevBalance = await config.flightSuretyData.getAddressBalance({from: config.owner});
    console.log(`contract Balance before payout: ${prevBalance.toNumber()}`);
    // ACT
    try {
        await config.flightSuretyApp.withdrawPayout({from: passenger});
        //Get balance of the passenger previous to the transaction
        /* let previousBalance = await web3.fromWei(web3.eth.getBalance(passenger));
        console.log(previousBalance);
        var transaction = await config.flightSuretyApp.withdrawPayout({from: passenger});
        //Get gasUsed by the transaction
        let gasPrice = 20000000000;
        let gasUsed = transaction.receipt.gasUsed * 20000000000;
        //Get balance of the passenger after the transaction
        let afterBalance = await web3.eth.getBalance(passenger); */
    }
    catch(e) {
        revert = true;
        console.log(e);
    }
    let postBalance = await config.flightSuretyData.getAddressBalance({from: config.owner});
    console.log(`contract Balance after payout: ${postBalance.toNumber()}`);
       
    // ASSERT
    assert.equal(revert, false, "Passenger could not withdraw");
    //(Balance previous to transaction) < (Balance after transaction) + (gasUsed by the transaction)
    //assert.equal(parseInt(previousBalance) < (gasUsed + parseInt(afterBalance)), true, "Passenger could not withdraw");

  });

  it('(passenger) Purchase flight Insurance > 1 ETH', async () => {
    
    // ARRANGE
    
    let passenger = accounts[7];
    let airline = accounts[4];
    let flightNumber = "AA241";
    
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

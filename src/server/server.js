import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];

let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

let registeredOracles = [];


//Get Oracle accounts
web3.eth.getAccounts( async (error, accounts) => {
  
  //Set authorize caller
  flightSuretyData.methods
    .authorizeCaller(config.appAddress)
    .send({ from: accounts[0] }, (error, result) => {
      if(error) {
        console.log(error);
      } else {
        console.log("Set Authorized caller.");
      }
    });
        //Get registration fee from app
        flightSuretyApp.methods.REGISTRATION_FEE().call({ from: accounts[0] }, async (error, result) => {
          //console.log(accounts);
          if(error){
            console.log(error);
          }else{
            let regFee = result.toString();
            
            //Register 20 oracles
            let oracle = [];
            let indexes = [];
            for(var i = 10; i < 40; i++){
              let accountOra = accounts[i];
                //console.log("registration fee "+regFee);   
                //console.log("Account "+accounts[i]);
                await flightSuretyApp.methods
                  .registerOracle().send({ from: accountOra, value: regFee, gas:3000000}, async (error, result2) => {
                    if(error){
                      console.log(error);
                    }else{
                      //console.log("sucess");
                      /* console.log(result2);
                      flightSuretyApp.methods.oracles(accountOra).call({ from: accountOra },function(err,res) {
                        console.log(res)
                      }); */
                      
                await flightSuretyApp.methods
                      .getMyIndexes()
                      .call({ from: accountOra }, (error, result3) => {
                        if(error){
                          console.log(error);
                        }else{
                          indexes = result3;
                          oracle.push(accountOra);
                          oracle.push(indexes);
                          registeredOracles.push(oracle);
                          //console.log ("Oracle : " + oracle);
                          oracle = [];
                        }
                      }); 
                    }
                  });
              }
          }
        }); 
      
}); 

flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, async function (error, event) {
  if (error) {
    //console.log(error);
  }else{
    //console.log(event);
    var statusCodes = [0, 10, 20, 30, 40, 50];
    //var statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    var statusCode = 20; //to test

    let indexes;
    let oracle;
    
    let index = event.returnValues.index;
    let airline = event.returnValues.airline;
    let flight = event.returnValues.flight;
    let time = event.returnValues.timestamp;
    
    for(var i = 0; i < registeredOracles.length; i++) {
      indexes  = registeredOracles[i][1];
       
      if(indexes.indexOf(index.toString()) != -1) {
          // Submit Oracle Response
          oracle = registeredOracles[i][0];
          await submitResponse(index, airline, flight, time, statusCode, oracle);
      
    }
    } 
    
  }
  
});

async function submitResponse(index, airline, flight, time, statusCode, oracle){
  
  try{
    await flightSuretyApp.methods
              .submitOracleResponse(index, airline, flight, time, statusCode)
              .send({ from: oracle, gas:200000 } , (error, result) => {
                if(error) {
                  //console.log(error);
                } else{
                  console.log(result);
                  console.log("Sent Oracle Response " + oracle + " Status Code: " + statusCode);
                
                }
            });
  } catch(e){
    //console.log(e);
  }
}

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;



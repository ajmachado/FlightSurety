import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

let registeredOracles = []

//Get Oracle accounts
 web3.eth.getAccounts( (error, accounts) => {
  //Get registration fee from app
       
        flightSuretyApp.methods.REGISTRATION_FEE().call({ from: accounts[0] },(error, result) => {
          //console.log(accounts);
          if(error){
            console.log(error);
          }else{
            let regFee = result.toString();
            
            //Register 20 oracles
            let oracle;
            for(var i = 10; i < 11; i++){
                console.log(accounts[i]);                               
                flightSuretyApp.methods
                  .registerOracle().call({ from: accounts[i], value: regFee, gas:3000000}, (error, result2) => {
                    if(error){
                      console.log(error);
                    }else{
                      console.log(result2);
                      flightSuretyApp.methods.oracles(accounts[i]).call({ from: accounts[0] },function(err,res) {
                        console.log(res)
                      });
                      flightSuretyApp.methods.generateIndexes(accounts[i]).call({ from: accounts[0] },function(err,res) {
                        console.log(res)
                      });
                      flightSuretyApp.methods
                      .getMyIndexes()
                      .call({ from: accounts[i] }, (error, result3) => {
                        if(error){
                          console.log(error);
                        }else{
                          oracle = [accounts[i], result3];
                          registeredOracles.push(oracle);
                          console.log ("Oracle : " + oracle);
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
  }, function (error, event) {
    if (error) {
      console.log(error);
    }else{
      console.log(event);
      var statusCodes = [0, 10, 20, 30, 40, 50];
      var statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];

      let indexes;
      for(var i = 0; i < registeredOracles.length; i++) {
        indexes  = registeredOracles[i][1]
        if(indexes.indexOf(event.index) > -1) {
          
          // Submit Oracle Response
          flightSuretyApp.methods
            .submitOracleResponse(event.index, event.airline, event.flight, event.timestamp, statusCode)
            .send({ from: registeredOracles[i] }, (error, result) => {
              if(error) {
                console.log(error);
              } 
            });
        } 
      } 
    }
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;



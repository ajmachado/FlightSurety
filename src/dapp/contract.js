import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import './flightsurety.css';

export default class Contract {
    constructor(network, callback) {
        
        async function initializeProvider() {
             if (window.ethereum) {
                // use MetaMask's provider
                await window.ethereum.enable(); // get permission to access accounts
                return(window.ethereum);
            } else { 
                //return window.web3.currentProvider;
             return(new Web3.providers.HttpProvider("http://localhost:9545"));
            }
        };
        let self = this
        initializeProvider().then(function (provider) {
            
            let config = Config[network];
            //self.web3 = new Web3(provider);
            //console.log(provider);
            
            self.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
            //self.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
            self.web3Window = new Web3(provider);
            self.flightSuretyApp = new self.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
            self.flightSuretyData = new self.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
            self.flightSuretyAppWindow = new self.web3Window.eth.Contract(FlightSuretyApp.abi, config.appAddress);
            self.initialize(callback, config);
            self.owner = null;
            self.airlines = [];
            self.passengers = [];
            self.flights = [];
        });
    }

    initialize(callback, config) {
        this.web3.eth.getAccounts((error, accts) => {
            this.owner = accts[0];
            this.passenger = accts[9];

            this.web3Window.eth.getAccounts((error, accts) => {
                this.ownerWindow = accts[0];
            });
            
            let counter = 1;
            let flight= [];
            let airline = [];
            let tempAirline = ['United', 'American', 'Lufthansa', 'Southwest', 'Delta'];
            let tempFlight = ['UA144', 'AA222', 'DT026', '9W76', 'EK112'];
            let tempFlightOrigin = ['EWR', 'ORD', 'MUC', 'STL', 'BOS'];
            let tempFlightDest = ['LHR', 'LAX', 'JFK', 'SEA', 'PHL'];
            let tempFlightTime = ['7:00 AM', '2:12 PM', '8:30 PM', '9:15 AM', '6:08 AM']
            let time = 0;

            while(this.airlines.length < 5) {
                flight.push(accts[counter]);
                flight.push(tempFlight[counter - 1]);
                time = Math.floor((Date.now() + (43200 * counter))/ 1000);
                flight.push(time);
                flight.push(tempFlightTime[counter - 1]);
                flight.push(tempFlightOrigin[counter - 1]);
                flight.push(tempFlightDest[counter - 1]);
                flight.push(tempAirline[counter - 1]);
                airline.push(accts[counter]);
                airline.push(tempAirline[counter -1]);
                this.airlines.push(airline);
                this.flights.push(flight);
                flight = [];
                airline = [];
                counter++;
            }
                      

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
            this.authorizeCaller(config.appAddress); //Authorize call for the data contract
            this.registerAirlines((error, result) => { }); //Registers all airlines
            this.registerFlights((error, result) => { }); //Register 5 flights to pre fill flight dropdown
            callback();
        });
    }

    authorizeCaller(address, callback){
        let self = this;
        self.flightSuretyData.methods
            .authorizeCaller(address)
            .call({ from: self.owner}, callback);
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    registerAirlines(callback) {
        let self = this;
        
        let airl = self.airlines;

        for(var i = 1; i < airl.length; i++)
        {
            self.flightSuretyApp.methods
            .registerAirline(airl[i][0])
            .call({ from: airl[0][0]}, callback);
        } 
    }

    registerFlights(callback) {
        let self = this;
        let flts = self.flights;
                
        for(var i = 0; i < flts.length; i++)
        {
            self.flightSuretyApp.methods
            .registerFlight(flts[i][2], flts[i][0], flts[i][1])
            .send({ from: self.owner}, callback);
        }
    }

    fundAirline(airline, amount, callback){
        let self = this;
        let sendAmt = self.web3.utils.toWei(amount, "ether").toString();
        
        self.flightSuretyAppWindow.methods
            .fund()
            .send({ from: self.ownerWindow, value: sendAmt}, (error, result) => {
                if(error) {
                    console.log(error);
                } else {
                    callback(result);
                }
            });
    }
    
    insurePassenger(flight, amount, callback) {
        let self = this;
        let tempFlight;
        
        for (var i=0; i < self.flights.length; i++){
            
            if(self.flights[i][1] == flight) {
                tempFlight = self.flights[i];
                break;
            }
        }
        console.log (tempFlight);
        console.log (self.ownerWindow);
        console.log(self.web3.utils.toWei(amount, "ether"));
        let sendAmt = self.web3.utils.toWei(amount, "ether").toString();
        console.log(sendAmt);
        self.flightSuretyAppWindow.methods
            .insurePassenger(tempFlight[1], tempFlight[2], tempFlight[0])
            .send({ from: self.ownerWindow, value: sendAmt}, (error, result) => {
                if(error) {
                  console.log(error);
                } else {
                  callback(result);
                }
            });
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0][0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    

}
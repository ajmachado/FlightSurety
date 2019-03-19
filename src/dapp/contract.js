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
             return(new Web3.providers.HttpProvider("http://localhost:8545"));
            }
        };
        let self = this
        initializeProvider().then(function (provider) {
            
            let config = Config[network];
            //self.web3 = new Web3(provider);
            //console.log(provider);
            
            self.web3 = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8545"));
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
                //Create Flight array
                flight.push(accts[counter]); //airline account
                flight.push(tempFlight[counter - 1]); //flight number
                time = Math.floor((Date.now() + (43200 * counter))/ 1000);
                flight.push(time); //timestamp
                flight.push(tempFlightTime[counter - 1]); //time
                flight.push(tempFlightOrigin[counter - 1]); //origin
                flight.push(tempFlightDest[counter - 1]); //destination
                flight.push(tempAirline[counter - 1]); //airline name

                //Create airlines array
                airline.push(accts[counter]); //account number
                airline.push(tempAirline[counter -1]); //airline name
                if(counter == 1)
                    airline.push(true);
                else
                    airline.push(false); //funding status

                this.airlines.push(airline);
                this.flights.push(flight);

                //reset arrays
                flight = [];
                airline = [];
                counter++;
            }
                      
            //Get accounts for passengers
            while(this.passengers.length < 4) {
                this.passengers.push(accts[counter++]);
            }
            
            //Set authorize caller for the data app
            this.authorizeCaller(config.appAddress); //Authorize call for the data contract

            //register the airlines and flights
            this.registerAirlines((error, result) => { }); //Registers all airlines
            this.registerFlights((error, result) => { }); //Register 5 flights to pre fill flight dropdown

            callback();
        });
    }

    authorizeCaller(address, callback){
        let self = this;
        self.flightSuretyData.methods
            .authorizeCaller(address)
            .call({ from: self.owner}, (error,result) => {
                if(error){
                    console.log(error);
                }else {
                    //console.log(result);
                    callback;
                }
            });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, (error,result) => {
                if(error){
                    console.log(error);
                }else {
                    console.log(result);
                    callback(result);
                }
            });
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

    async fundAirline(airline, amount, callback){
        let self = this;
        let sendAmt = self.web3.utils.toWei(amount, "ether").toString();
        console.log(airline);
                
        await self.flightSuretyAppWindow.methods
            .fund(airline)
            .send({ from: self.ownerWindow, value: sendAmt }, (error, result) => {
                if(error) {
                    console.log(error);
                } else {
                    
                    for(var i = 0; i < this.airlines.length; i++){
                        if(self.airlines[i][0] == airline)
                        self.airlines[i][2] = true;
                    }
                    callback(result);
                }
            }); 
    }
    
    async insurePassenger(flight, amount, callback) {
        let self = this;
        let tempFlight;
        
        for (var i=0; i < self.flights.length; i++){
            
            if(self.flights[i][1] == flight) {
                tempFlight = self.flights[i];
                break;
            }
        }

        let sendAmt = self.web3.utils.toWei(amount, "ether").toString();
        
        self.flightSuretyAppWindow.methods
            .insurePassenger(tempFlight[1], tempFlight[2], tempFlight[0], this.passengers[0])
            .send({ from: self.ownerWindow, value: sendAmt}, (error, result) => {
                if(error) {
                  console.log(error);
                } else {
                  callback(result);
                }
            });
    }

    async fetchFlightStatus(flight, callback) {
        let self = this;
        let airline;
        self.flights.forEach(flt => {
            if(flt[1] == flight){
                airline = flt[0];
                
            }
        });
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        await self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                console.log(result);
                callback(error, payload);
            });
    }

    async flightStatusInfo(callback) {
        let self = this;
        await self.flightSuretyApp.events.FlightStatusInfo({}, function(error, event) {
            if(error) {
                console.log(error);
            } else {
                callback(event.returnValues);
            }
        })
    }

    async getInsuranceInformation(passenger, callback){
        let self = this
        let insuranceInfo = [];
        let amt;

        for(var i= 0; i< self.flights.length; i++){
            amt = await self.flightSuretyApp.methods
                .getFlightsInsured(passenger, self.flights[i][1])
                .send({from: this.owner});
            if(amt > 0){
                insuranceInfo.push([self.flights[i][1], amt]);
            }
        }
        callback(insuranceInfo);
    }

    

}
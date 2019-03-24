import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import './flightsurety.css';

export default class Contract {
    constructor(network, callback) {
        
        let self = this
        let config = Config[network];
            
        self.web3 = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8545"));
            
        self.flightSuretyApp = new self.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        self.flightSuretyData = new self.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        
        self.initialize(callback, config);
        self.owner = null;
        self.airlines = [];
        self.passengers = [];
        self.flights = [];
    }

    initialize(callback, config) {
        
        this.web3.eth.getAccounts(async (error, accts) => {
            this.owner = accts[0];
            
            let counter = 0;
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
                time = Math.floor((Date.now() + (43200 + counter))/ 1000);
                flight.push(accts[counter]); //Airline
                flight.push(tempFlight[counter]); //flight number
                flight.push(time); //timestamp
                flight.push(tempFlightTime[counter]); //time
                flight.push(tempFlightOrigin[counter]); //origin
                flight.push(tempFlightDest[counter]); //destination
                flight.push(tempAirline[counter]); //airline name 

                //Create airlines array
                airline.push(accts[counter + 1]); //account number
                airline.push(tempAirline[counter]); //airline name
                /* if(counter == 0)
                    airline.push(true);
                else */
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
            await this.fundAirline(this.airlines[0][0], "10", (error, result) => { } )
            this.registerAirlines((error, result) => { }); //Registers all airlines
            this.registerFlights((error, result) => { }); //Register 5 flights to pre fill flight dropdown
            
            callback();
        });
    }

    async authorizeCaller(address, callback){
        let self = this;
        await self.flightSuretyData.methods
            .authorizeCaller(address)
            .call({ from: self.owner}, (error,result) => {
                if(error){
                    console.log(error);
                }else {
                    callback;
                }
            });
    }

    async isOperational(callback) {
       let self = this;
       await self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, (error,result) => {
                if(error){
                    console.log(error);
                }else {
                    //console.log(result);
                    callback(result);
                }
            });
    }

    async registerAirlines(callback) {
        let self = this;
        let airl = self.airlines;

        for(var i = 1; i < airl.length; i++)
        {
            await self.flightSuretyApp.methods
            .registerAirline(airl[i][0])
            .call({ from: airl[0][0]}, callback);
        } 
    }

    async registerFlights(callback) {
        let self = this;
        let flts = self.flights;
                
        for(var i = 0; i < flts.length; i++)
        {
            await self.flightSuretyApp.methods
            .registerFlight(flts[i][2], flts[i][0], flts[i][1])
            .call({ from: self.owner}, callback);
        }
    }

    async getContractBalance(callback) {
        let self = this;

        await self.flightSuretyData.methods
        .getAddressBalance()
        .call({ from: self.owner }, callback);
    }

    async fundAirline(airline, amount, callback){
        let self = this;
        let sendAmt = self.web3.utils.toWei(amount, "ether").toString();
                        
        await self.flightSuretyApp.methods
            .fund()
            .send({ from: airline, value: sendAmt, gas:3000000 }, (error, result) => {
                if(error) {
                    console.log(error);
                } else {
                    let airlineName;
                    for(var i = 0; i < this.airlines.length; i++){
                        if(self.airlines[i][0] == airline)
                        {
                            self.airlines[i][2] = true;
                            airlineName = self.airlines[i][1];
                        }
                    }
                    callback(result, airlineName );
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
        console.log(sendAmt);
        
        await self.flightSuretyApp.methods
            .insurePassenger(tempFlight[1], tempFlight[2], tempFlight[0], self.passengers[1])
            .send({ from: self.passengers[1], value: sendAmt,  gas:3000000 }, (error, result) => {
                callback(error, result);
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
                callback(error, payload);
            });
    }

    async oracleReport(callback) {
        let self = this;
        await self.flightSuretyApp.events.OracleReport({}, function(error, event) {
            if(error) {
                console.log(error);
            } else {
                console.log(event.returnValues);
                callback(event.returnValues);
            }
        })
    }

    async flightStatusInfo(callback) {
        let self = this;
        await self.flightSuretyApp.events.FlightStatusInfo({}, function(error, event) {
            if(error) {
                console.log(error);
            } else {
                //console.log(event.returnValues);
                callback(event.returnValues);
            }
        })
    }

    async getInsuranceInformation(passenger, callback){
        let self = this
        let insuranceInfo = [];
        let amt;
               
        for(var i= 0; i< self.flights.length; i++){
            //console.log(self.flights[i][1]);
            await self.flightSuretyApp.methods
                .getFlightsInsured(passenger, self.flights[i][1])
                .call({from: self.owner},(error, result) => {
                    if(error){
                        console.log(error);
                    }else {
                        //console.log(result);
                        insuranceInfo.push([self.flights[i][1], result]);
                    }
                });
         }
        //console.log(insuranceInfo);
        callback(insuranceInfo);
    }

    async getPassengerCredits(passenger, callback){
        let self = this;

        self.flightSuretyApp.methods
            .getPassengerCredits(passenger)
            .call({from: passenger}, (error, result) =>{
                if(error){
                    console.log(error);
                }else {
                    console.log(result);
                    callback(result);
                }
            });
    }
    
    async getPassengerBalance(passenger, callback){
        let self = this;

        let balance = await self.web3.eth.getBalance(passenger);
        callback(balance);
    }

    async withdraw(passenger, callback){
        let self = this;

        /* await self.flightSuretyData.methods
            .testFunction2(passenger)
            .call({from: self.owner}, (error, result) => {
                if(error){
                    console.log(error);
                }else {
                    callback(result);
                }
            }); */

         await self.flightSuretyApp.methods
            .withdrawPayout()
            .send({from: passenger}, (error, result) => {
                if(error){
                    console.log(error);
                }else {
                    console.log(result);
                    callback(result);
                }
            }); 
    }

}
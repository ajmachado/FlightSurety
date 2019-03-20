import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {
        
        // Read transaction
        contract.isOperational((error, result) => {
            displayOperStatus('Operational Status', '' , [ { label: 'Operational Status', error: error, value: result} ]);
        });
    
        //Pre fill airlines dropdown with airlines that are not yet funded
        populateSelect("airline", contract.airlines, 1);

        //Pre fill the flights dropdown
        populateSelect("flights", contract.flights, 1);
        populateSelect("flights", contract.flights, 2);
        populateSelect("flights", contract.flights, 3);
        flightChange('flights', 2, contract.flights);
        flightChange('flights', 3, contract.flights);

        //Get Insurance Information for passenger
        /* contract.getInsuranceInformation(contract.passengers[0], (error, result) => {
            if(!error){
                let insuranceInfo = result;
                fillInsuranceInfo('Insurance Information for:', contract.passengers[0], insuranceInfo);
            }else{
                console.log(error);
            }
        }); */
        
        DOM.elid('fund').addEventListener('click', () => {
            let airline = DOM.elid('airline1').value;
            let amount = DOM.elid('fundAmount').value;
            // Write transaction
            if(amount == 10){
                contract.fundAirline(airline, amount, (error, result) => {
                    displayFund('Airline funding', [ { label: 'Funding status : ', TXid: error, airline: airline, amount: amount} ]);
                });
            }
            else {
                alert("Airlines need to pay 10 ETH.");
            }
        })

        DOM.elid('flights1').addEventListener('change', () => {
            flightChange('flights', 1, contract.flights);
        })

        DOM.elid('flights2').addEventListener('change', () => {
            flightChange('flights', 2, contract.flights);
        })

        DOM.elid('flights3').addEventListener('change', () => {
            flightChange('flights', 3, contract.flights);
        })

        // User-submitted transaction. Check Flight Status
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flights1').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                displayFlightStatus('display-wrapper-flight-status','Oracles', 'Trigger oracles', 0, [ { label: 'Flight Status : ', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })

        // User-submitted transaction. Check Flight Status
        DOM.elid('flight-status').addEventListener('click', () => {
            let flight = DOM.elid('flights3').value;
            // Write transaction
            let flightStatus = 0;
            contract.fetchFlightStatus(flight, (error, result) => {
                if(!error){
                    contract.flightStatusInfo(result2 => {
                            flightStatus = result2.status;
                            console.log(flightStatus);
                            //contract.insuranceBalance(insuranceBalanceCallback);
                    });
                }
                console.log(error);
                displayFlightStatus('flightStatusInfo','Flight Status', '', flightStatus, [ { label: 'Flight Status : ', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });

           
        })

        DOM.elid('purchase').addEventListener('click', () => {
            let flight = DOM.elid('flights2').value;
            let amount = DOM.elid('insurance').value;
            // Write transaction
            if(amount != ""){
                contract.insurePassenger(flight, amount, (error, result) => {
                    displayInsurance('Insurance Purchase', [ { label: 'Purchase status : ', error: error, flight: flight, amount: amount} ]);
                });
            }
            else {
                alert("Insurance Amount is required and should be a number.");
            }
        })

        // User-submitted transaction. Get Insurance Credits
        DOM.elid('checkCredit').addEventListener('click', () => {
            
            // Write transaction
            contract.getPassengerCredits(contract.passengers[0], (result) => {
                //let creditText = DOM.elid('passCredit').value + " " + result;
                DOM.elid('passCredit').textContent = DOM.elid('passCredit').textContent + " " + result + "ETH";
            });
        })

        // User-submitted transaction. Get Account Balance
        DOM.elid('getBalance').addEventListener('click', () => {
            
            // Write transaction
            contract.getPassengerBalance(contract.passengers[0], (result) => {
                //let creditText = DOM.elid('passBalance').value + " " + result;
                
                DOM.elid('passBal').textContent = DOM.elid('passBal').textContent + " " + result + "ETH";
            });
        })

        // User-submitted transaction. Withdraw Incurance credit
        DOM.elid('withdraw').addEventListener('click', () => {
            
            // Write transaction
            contract.withdraw(contract.passengers[0], (error, result) => {
                DOM.elid('withdraw-status').innerHTML = result;          
            });
        })
    
    });
    

})();

function populateSelect(type, selectOpts, el){
    let select = DOM.elid(type + el);
    let index = type == 'airline' ? 0: 1;
    selectOpts.forEach(opt => {
        if((type  == 'airline' && opt[2] == false) || type == 'flights'){
            select.appendChild(DOM.option({value: opt[index]}, opt[1] ));
        }
    });
    
}

function displayOperStatus(title, description, results) {
    let displayDiv = DOM.elid("display-operational-status");
    let section = DOM.section();
    section.appendChild(DOM.h4(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function flightChange(el, n, flights){
    el = el + n
    let flight = DOM.elid(el).value;
    let flightArr;
    
    for (var i = 0; i < flights.length; i++){
        if(flights[i][1] == flight){
            flightArr = flights[i];
            break;
        }
    }
    let num = el.charAt(el.length - 1);
    displayFlightInfo(num, flightArr);
}

function displayFlightInfo(num, flight) {
    let displayDiv = DOM.elid("flightInfo" + num);
    displayDiv.innerHTML = "";
    let section = DOM.section();
    
    let line1 = "Airlines: " + flight[6] + " Departs at: " + flight[3];
    let line2 = "Departs From: " + flight[4] + " Lands at: " + flight[5];
    
    section.appendChild(DOM.div({className: 'col-sm-4 field', style: { margin: 'auto 0 auto 0'}}, line1));
    section.appendChild(DOM.div({className: 'col-sm-4 field', style: { margin: 'auto 0 auto 0'}}, line2));
    displayDiv.append(section);
}

function displayFund(title, results) {
    let displayDiv = DOM.elid("display-wrapper-funding-status");
    let section = DOM.section();
    section.appendChild(DOM.h5(title));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, String(result.airline) + "Funded."));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.TXid ? ("TX Id : " + String(result.TXid)) : ("Funded : TX: " + String(result.airline))));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function displayFlightStatus(divID, title, description, status, results) {
    let displayDiv = DOM.elid(divID);
    let section = DOM.section();
    //section.appendChild(DOM.h4(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        let displayStr = String(result.value);
        

        if(status != 0){
            switch(status){
                case 0 :
                    displayStr += " : Unknown";
                    break;
                case 10 :
                    displayStr += " : On Time";
                    break;
                case 20 :
                    displayStr += " : Late due to Airline";
                    break;
                case 30 :
                    displayStr += " : Late due to weather";
                    break;
                case 40 :
                    displayStr += " : Late due to technical problems";
                    break;
                case 50 :
                    displayStr += " : Late due to other reasons";
                    break;
            }
        }
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : displayStr));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function displayInsurance(title, results) {
    let displayDiv = DOM.elid("display-wrapper-insurance-status");
    let section = DOM.section();
    section.appendChild(DOM.h5(title));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.flight)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function fillInsuranceInfo(title, passenger, insuranceInfo){
    let displayDiv = DOM.elid("display-wrapper-insurance-status");
    let section = DOM.section();
    title = title + " " + passenger;
    section.appendChild(DOM.h5(title));
    insuranceInfo.forEach(flight => {
        section.appendChild(DOM.label(flight[0] + " : "));
        section.appendChild(DOM.label(flight[1] + " ETH"));
    });
    
    displayDiv.append(section);
}


















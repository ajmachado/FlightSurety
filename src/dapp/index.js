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

        async function getBalance() {
            await contract.getContractBalance((error, result) => {
                if(error) 
                    console.log(error);
            else
                    console.log(`contract balance = ${result}`);
                    displayContractBal('Contract Balance', result);
            })
        } 

        getBalance();
        getCredits();
        getPassBalance();
    
        //Pre fill airlines dropdown with airlines that are not yet funded
        populateSelect("airline", contract.airlines, 1);
        
        //Pre fill the flights dropdown
        populateSelect("flights", contract.flights, 1);
        populateSelect("flights", contract.flights, 2);
        populateSelect("flights", contract.flights, 3);
        flightChange('flights', 2, contract.flights);
        flightChange('flights', 3, contract.flights);

        //Get Insurance Information for passenger
         /* contract.getInsuranceInformation(contract.passengers[0], (result) => {
                if(result.length > 0) {
                    result.forEach(insurance => {
                        fillInsuranceInfo('Passenger Insured on : ', insurance[0]);
                    })
                }
        });  */
        
        DOM.elid('fund').addEventListener('click', () => {
            let airline = DOM.elid('airline1').value;
            let amount = DOM.elid('fundAmount').value;
            // Write transaction
            if(amount == 10){
                contract.fundAirline(airline, amount, (tx, result) => {
                    displayFund('Airline funding', [ { label: 'Funding status : ', TXid: tx, airline: result, amount: amount} ]);
                    getBalance();
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
                console.log(error);
                //if(error == null){
                    contract.flightStatusInfo(result2 => {
                        console.log(result2);
                            flightStatus = result2.status;
                            displayFlightStatus('flightStatusInfo','Flight Status', '', flightStatus, [ { label: 'Flight Status : ', error: error, value: result.flight + ' ' + result.timestamp} ]);
                            getBalance();
                            getCredits();
                        });
                //}
                
                //displayFlightStatus('flightStatusInfo','Flight Status', '', flightStatus, [ { label: 'Flight Status : ', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });

            
        })

        DOM.elid('purchase').addEventListener('click', () => {
            let flight = DOM.elid('flights2').value;
            let amount = DOM.elid('insurance').value;
            // Write transaction
            if(amount != "" || amount == 0){
                contract.insurePassenger(flight, amount, (error, result) => {
                    let display = result;
                    if(error) display = error;
                    
                    displayInsurance('Insurance Purchase', [ { label: 'Purchase TX# : ', text: display, flight: flight, amount: amount} ]);
                    if(!error) 
                    {
                        fillInsuranceInfo('Passenger Insured on : ', flight);
                        getBalance();
                        getPassBalance();
                    }
                });
            }
            else {
                alert("Insurance Amount is required and should be a number greater than zero.");
            }
        })

        async function getCredits() {
            await contract.getPassengerCredits(contract.passengers[1], (result) => {
                //let creditText = DOM.elid('passCredit').value + " " + result;
                DOM.elid('passCreditAmt').textContent = result ;
            });
        }

        // User-submitted transaction. Get Insurance Credits
        DOM.elid('checkCredit').addEventListener('click', () => {
            getCredits();
        })

        async function getPassBalance() {
            await contract.getPassengerBalance(contract.passengers[1], (result) => {
                DOM.elid('passBalAmt').textContent = result ;
            });
        }

        // User-submitted transaction. Get Account Balance
        DOM.elid('getBalance').addEventListener('click', () => {
            getPassBalance();
        })

        // User-submitted transaction. Withdraw Incurance credit
        DOM.elid('withdraw').addEventListener('click', () => {
            
            // Write transaction
            contract.withdraw(contract.passengers[1], (result) => {
                //console.log(result);
                DOM.elid('withdraw-status').innerHTML = DOM.elid('withdraw-status').innerHTML + "<br> TX ID: " + result;
                getBalance();
                getCredits();
                getPassBalance();          
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

function displayContractBal(description, balance) {
    let displayDiv = DOM.elid("display-contract-balance");
    displayDiv.innerHTML = "";
    let section = DOM.section();
    section.appendChild(DOM.h5(description));
    section.appendChild(DOM.div({className: 'col-sm-8 field-value'}, balance));
    displayDiv.append(section);
}


function flightChange(el, n, flights){
    el = el + n
    let flight = DOM.elid(el).value;
    let flightArr = [];
    
    for (var i = 0; i < flights.length; i++){
        if(flights[i][1] == flight){
            flightArr.push(flights[i]);
            break;
        }
    }
    
    let num = el.charAt(el.length - 1);
    if( n > 1)
    displayFlightInfo(num, flightArr);
}

function displayFlightInfo(num, flight) {
    let divname = "flightInfo" + num;
    let displayDiv = DOM.elid(divname);
    displayDiv.innerHTML = "";
    let section = DOM.section();
    
    let line1 = "Airlines: " + flight[0][6] + " Departs at: " + flight[0][3];
    let line2 = "Departs From: " + flight[0][4] + " Lands at: " + flight[0][5];
    
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
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, String(result.airline) + " Funded."));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.TXid ? ("TX Id : " + String(result.TXid)) : ("Funded : TX: " + String(result.airline))));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function displayFlightStatus(divID, title, description, status, results) {
    //console.log(results)
    let displayDiv = DOM.elid(divID);
    displayDiv.innerHTML = "";
    let section = DOM.section();
    
    section.appendChild(DOM.h5(description));
    
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, results[0].label));
        let displayStr = String(results[0].value);
       
        switch(status){
            case "0" :
                displayStr = displayStr + " : Unknown";
                break;
            case "10" :
                displayStr = displayStr + " : On Time";
                break;
            case "20" :
                displayStr = displayStr + " : Late due to Airline";
                break;
            case "30" :
                displayStr = displayStr + " : Late due to weather";
                break;
            case "40" :
                displayStr = displayStr + " : Late due to technical problems";
                break;
            case "50" :
                displayStr = displayStr + " : Late due to other reasons";
                break;
            }
        
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, results[0].error ? String(results[0].error) : displayStr));
        section.appendChild(row);
    
    displayDiv.append(section);

}

function displayInsurance(title, results) {
    let displayDiv = DOM.elid("display-wrapper-insurance-status");
    let section = DOM.section();
    section.appendChild(DOM.h5(title));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        //row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.flight)));
        //console.log(result.text);
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, String(result.text)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function fillInsuranceInfo(title, flight){
    let displayDiv = DOM.elid("display-wrapper-insurance-info");
    if(displayDiv.innerHTML.length == 0){
        displayDiv.appendChild(DOM.label(title));
    }
    displayDiv.appendChild(DOM.label(" - " + flight + " "));
}


















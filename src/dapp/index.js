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
    
        //Pre fill airlines dropdown
        populateSelect("airline", contract.airlines, 1);
        //Pre fill the flights dropdown
        populateSelect("flights", contract.flights, 1);
        populateSelect("flights", contract.flights, 2);
        flightChange('flights2', contract.flights);
        //getInsuranceStatus()

        DOM.elid('fund').addEventListener('click', () => {
            let airline = DOM.elid('airline1').value;
            let amount = DOM.elid('fundAmount').value;
            // Write transaction
            if(amount == 10){
                contract.fundAirline(airline, amount, (error, result) => {
                    displayFund('Airline funding', [ { label: 'Funding status : ', error: error, airline: airline, amount: amount} ]);
                });
            }
            else {
                alert("Airlines need to pay 10 ETH.");
            }
        })

        DOM.elid('flights1').addEventListener('change', () => {
            flightChange('flights1', contract.flights);
        })

        DOM.elid('flights2').addEventListener('change', () => {
            flightChange('flights2', contract.flights);
        })

        // User-submitted transaction. Check Flight Status
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flights1').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                displayFlightStatus('Oracles', 'Trigger oracles', [ { label: 'Flight Status : ', error: error, value: result.flight + ' ' + result.timestamp} ]);
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
    
    });
    

})();

function populateSelect(type, selectOpts, el){
    let select = DOM.elid(type + el);
    let index = type == 'airline' ? 0: 1;
    
    for(var i= 0; i < selectOpts.length; i++)
    {
        select.appendChild(DOM.option({value: selectOpts[i][index]}, selectOpts[i][1] ));
    }

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

function flightChange(el, flights){
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
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.airline)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function displayFlightStatus(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper-flight-status");
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


















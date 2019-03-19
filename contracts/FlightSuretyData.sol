pragma solidity >=0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    //Operation variables
    bool private operational = true;            // Blocks all state changes throughout the contract if false
    
    mapping(address => bool) AuthorizedCallers;

    address private contractOwner;                                      // Account used to deploy contract
    uint256 private contractBalance = 10;  //10 because first airline is registered and funded when contract is deployed

    struct Airline {   //Airline Struct
        bool isRegistered;
        bool isFunded;
        address airlineAddress;
    }
    mapping(address => Airline) public RegisteredAirlines; //Registered airlines mapping
    address[] private registered; //Array of airline addresses


    struct Passenger {   //Passenger Struct
        bool isInsured;
        bool[] isPaid;
        uint256[] insurancePaid;
        string[] flights;
    }
    mapping(address => Passenger) private InsuredPassengers; //Passenger mapping

    //Flight to passenger mapping
    mapping(string => address[]) private FlightPassengers;

    //Flight to totalInsured Amount mapping e.g. UA047 => 5 ETH
    mapping(string => uint256) private FlightInsuredAmount;

    //Passenger address to insurance payment. Stores Insurance payouts for passengers
    mapping(address => uint256) private InsurancePayment;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address _airline) public 
    {
        contractOwner = msg.sender;
        //Add first airline when contract is deployed with funds
        //RegisteredAirlines[_airline] = Airline({isRegistered: true, isFunded: true, fundBalance: 10, airlineAddress: _airline});
        registerFirstAirline(_airline);        
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireAuthorizedCaller()
    {
        require(AuthorizedCallers[msg.sender] == true, "Caller is not authorized");
        _;
    }

    /**
    * @dev Modifier that requires the caller is a registered airline
    */
    modifier requireRegisteredAirline(address _airline)
    {
        require(RegisteredAirlines[_airline].isRegistered == true, "Caller is not a registered airline");
        _;
    }

    /**
    * @dev Modifier that requires the caller is a funded airline
    */
    modifier requireFundedAirline(address _airline)
    {
        require(RegisteredAirlines[_airline].isFunded == true, "Caller is not a funded airline");
        _;
    }

     /**
    * @dev Modifier that requires the caller withdraw less than or equal to owed
    */
    modifier checkAmount(address passenger, uint amount) {
        require(InsurancePayment[passenger] >= amount, "Withdrawing more than owed.");
        _;
        InsurancePayment[passenger].sub(amount);
        passenger.transfer(amount);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() public view returns(bool) 
    {
        return operational;
    }

    /**
    * @dev Authorize the calling contract
    */      
    function authorizeCaller(address _caller) public requireContractOwner
    {
        AuthorizedCallers[_caller] = true;
    }

    //Check if caller is authorized
    function isAuthorized(address _caller) public view returns(bool) 
    {
        return AuthorizedCallers[_caller];
    }

    //De-authorizes a caller
    function deAuthorizeCaller(address _caller) public requireContractOwner
    {
        AuthorizedCallers[_caller] = false;
    }

    /**
    * @dev check if airline is registered
    *
    * @return A bool 
    */      
    function isRegistered(address airline) public view returns(bool) 
    {
        return RegisteredAirlines[airline].isRegistered;
    }

    /**
    * @dev check if airline is funded
    *
    * @return A bool 
    */      
    function isFunded(address airline) public view returns(bool) 
    {
        return RegisteredAirlines[airline].isFunded;
    }

    /**
    * @dev check if passenger is insured
    *
    * @return A bool 
    */      
    function isInsured(address passenger, string memory flight) public view returns(bool success) 
    {
        //success = false;
        uint index = getFlightIndex(passenger, flight);
        if(index > 0) 
        {
            success = true;
        }else {
            success = false;
        }
        return success;
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
        (
            bool mode
        ) 
        external
    {
        operational = mode;
       
    }


    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
    function registerFirstAirline (address _airline) internal requireIsOperational
    {
        require(msg.sender == contractOwner, "Unauthorized to use this function");
        RegisteredAirlines[_airline] = Airline({isRegistered: true, isFunded: true, airlineAddress: _airline});
        registered.push(_airline);
    }
   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
        (
            address _airline,
            address caller
        ) 
        external 
        requireIsOperational
        requireRegisteredAirline(caller) //Check if caller is a registered airline
        requireFundedAirline(caller) //Check if caller is a funded airline
        returns
        (
            bool success
        )
    {
        //Check if airline is already registered
        require(!RegisteredAirlines[_airline].isRegistered, "Airline is already registered.");

        RegisteredAirlines[_airline] = Airline({isRegistered: true, isFunded: false, airlineAddress: _airline});
        success = true;
        
        return (success);
    }
    
    /**
    * @dev Get Number of airlines registered
    *
    */   
    function _getRegisteredAirlinesNum() 
        external 
        view
        requireIsOperational
        returns
        (
            uint256 number
        )
    {
        //Get the number of airlines registered
        number = registered.length;
        return number;
    }

    /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
        (         
            string memory flight,
            uint256 time,
            address passenger,
            address sender,
            uint256 amount                    
        )
        public
        payable
        requireIsOperational
    {
        //Check if flight time is less than current time. Flight already departed
        //require(time > now, "Passengers cannot purchase insurance on departed or landed flights");
        //contractOwner.transfer(amount);
        
        string[] memory _flights = new string[](5);
        bool[] memory paid = new bool[](5);
        uint256[] memory insurance = new uint[](5);
        uint index;
        
        //If passenger already insured before
       if(InsuredPassengers[passenger].isInsured == true){
            //check if passenger is trying to re-insure same flight
            index = getFlightIndex(passenger, flight) ;
            require(index == 0, "Passenger already insured for this flight");

            //Add new flight insurance info
            InsuredPassengers[passenger].isPaid.push(false);
            InsuredPassengers[passenger].insurancePaid.push(amount);
            InsuredPassengers[passenger].flights.push(flight);
           
        }else { 
             paid[0] = false; //set isPaid to false
            insurance[0] = amount; //Set insurance premium amount
            _flights[0] = flight; //Set flight 
            InsuredPassengers[passenger] = Passenger({isInsured: true, isPaid: paid, insurancePaid: insurance, flights: _flights}); 
         }
        contractBalance.add(amount);
        FlightPassengers[flight].push(passenger);
        FlightInsuredAmount[flight] = FlightInsuredAmount[flight].add(amount);  
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
        (
            string  flight
        )
        external
        requireIsOperational
    {
        require(FlightInsuredAmount[flight] <= contractBalance, "Not enough balance to pay insurees");

        address[] memory passengers = FlightPassengers[flight];
        bool[] memory paid;
        uint[] memory insurance;
        uint index;

        for(uint i = 0; i < passengers.length; i++){
            //code to pay passengers
            paid = InsuredPassengers[passengers[i]].isPaid;
            insurance = InsuredPassengers[passengers[i]].insurancePaid;
            index = getFlightIndex(passengers[i], flight);
            paid[index] = true;
            InsuredPassengers[passengers[i]].isPaid = paid;
            uint a = 15;
            uint b = 10;
            uint amount = insurance[index].mul(a.div(b));
            InsurancePayment[passengers[i]].add(amount);
        }
    }

     /**
     *  @dev Get Index array of Flight
     *
    */
    function getFlightIndex(address pass, string memory flight) public view returns(uint index)
    {
        //uint num = InsuredPassengers[pass].flights.length;
        string[] memory flights = new string[](5);
        flights = InsuredPassengers[pass].flights;
        
        for(uint i = 0; i < flights.length; i++){
            if(uint(keccak256(abi.encodePacked(flights[i]))) == uint(keccak256(abi.encodePacked(flight)))) {
               return(i + 1);
           }
        }

        return(0);
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function withdraw(address payee, uint amount) external payable checkAmount(payee, amount) requireIsOperational
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
        (   
            uint256 fundAmt,
            address _airline,
            address sender
        )
        public
        payable
        requireIsOperational
    {
        //require(isFunded(_airline) == false, "Airline is already funded");
        RegisteredAirlines[_airline].isFunded = true;
        //contractOwner.transfer(fundAmt);
        contractBalance.add(fundAmt);
        registered.push(_airline);
    }

    function getFlightKey
        (
            address airline,
            string memory flight,
            uint256 timestamp
        )
        pure
        internal
        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function getFlightsInsured
        (
        address passenger,
        string flight
        )
        external 
        view
        requireIsOperational
        returns
        (
            uint amount
        )
    {
        amount = 0;
        for(uint i = 0; i < InsuredPassengers[passenger].flights.length; i++){
            if(keccak256(abi.encodePacked(InsuredPassengers[passenger].flights[i])) == keccak256(abi.encodePacked(flight))){
                amount = InsuredPassengers[passenger].insurancePaid[i];
                break;
            }
        }
        
    }

    function getFlightAmountInsured
        (
            string flight
        )
        external 
        view 
        requireIsOperational 
        returns
        (
            uint amount
        )
    {
        amount = FlightInsuredAmount[flight];
    }

    function testFunction() public view requireIsOperational returns(bool success)
    {
        success = true;
    }

    function testFunction2(address passen) public view requireIsOperational returns(string memory flights)
    {
       //success = InsuredPassengers[passen].isInsured;
        //pass = InsuredPassengers[passen];
        flights = InsuredPassengers[passen].flights[0];
    }

    
    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
        external 
        payable 
    {
        fund(msg.value, address(0), msg.sender);
    }
}


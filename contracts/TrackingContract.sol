// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract TrackingContract {
    //Array size
    //how the array is stored in the blockchain?
    //create a structure for shipment
    struct Shipment {
        string uid;
        string description;
        string origin;
        string current;
        string destination;
        string companyCode;
        string status;
        uint256 scannedTime;
    }

    //the person trying to make a transaction.
    address public me;

    Shipment[] public shipments;
    //mapping(string => Shipment) public shipments;

    uint256 public totalTransactions;

    // constructor
    constructor() {
        me = msg.sender;
    }

    event InsertShipment(
        Shipment shipment
    );


    event ShipmentUpdated(
        Shipment shipment
    );

    
    function insert(Shipment memory _shipment
    ) public {
        shipments.push(_shipment);
        emit InsertShipment(_shipment);
        totalTransactions++;
    }
     
    function updateStatus(Shipment memory updatedShipment) public{
       for(uint256 i =0; i< totalTransactions; i++){
           if(compareStrings(shipments[i].uid, updatedShipment.uid)){
              shipments[i] = updatedShipment;
           }
       }

       emit ShipmentUpdated(updatedShipment);
             
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    function getShipmentsByUID(string calldata _uid) public view returns(Shipment memory){
        for(uint256 i =0; i< totalTransactions; i++){
           if(compareStrings(shipments[i].uid, _uid)){
              return shipments[i];
           }
       }
       revert("Shipment Not Found");
    }
}

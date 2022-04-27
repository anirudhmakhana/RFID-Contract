// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract TrackingContract {

    //create a structure for scanned
    struct Details{
        string scannedAt;
        uint256 scannedTime;
        string status;
    }

    //create a structure for shipment
    struct Shipment {
        string uid;
        Details[] shipmentDetails;
        string producer;
    }

    //the person trying to make a transaction.
    address public me;

    //Shipment[] public shipments;
    mapping(string => Shipment) public shipments;

    uint256 public totalTransactions;

    // constructor
    constructor() {
        me = msg.sender;
    }

    event ShipmentDetails(
        Details[] details
    );

    event ShipmentProducer(
        string producer
    );

    event StatusUpdated(
        string _uid,
        string _status
    );

    
    function insert(
        string calldata _uid,
        string calldata _producer,
        string calldata _scannedAt,
        string calldata _status
    ) external returns (uint256) {
        Details memory newDetails = Details(_scannedAt, block.timestamp, _status);
        shipments[_uid].uid = _uid;
        shipments[_uid].producer = _producer;
        shipments[_uid].shipmentDetails.push(newDetails);
        totalTransactions++;

        return totalTransactions;
    }

    function getShipmentDetails(string memory _uid) public returns(Details[] memory ){
        emit ShipmentDetails(shipments[_uid].shipmentDetails);
        return shipments[_uid].shipmentDetails;
    }
     
    function compareStrings(string memory a, string memory b) public pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    function updateStatus(string memory _uid, string memory _newStatus, string memory _newScannedAt) public returns (bool){
        for(uint256 i = 0; i < totalTransactions; i++){
            if(compareStrings(shipments[_uid].uid, _uid)){
                Details memory updatedDetails = Details(_newScannedAt, block.timestamp, _newStatus);
                shipments[_uid].shipmentDetails.push(updatedDetails);
                return true;
            }
        }   
        return false;
    }

    function getShipmentProducer(string memory _uid) public returns(string memory){
        emit ShipmentProducer(shipments[_uid].producer);
        return shipments[_uid].producer;
    }
        
}
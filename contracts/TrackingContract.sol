// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract TrackingContract {
    //create a structure for Product
    struct Product {
        string uid;
        uint256 scannedAt;
        string productName;
        string producer;
        string status;
    }
    //path of type array of distribution center
    //map with timestamp

    //the person trying to make a transaction.
    address public me;

    Product[] public products;

    uint256 public totalTransactions;

    // constructor
    constructor() {
        me = msg.sender;
    }

    event NewScanEvent(
        address indexed from,
        uint256 timestamp,
        string _uid,
        string _productName,
        string _producer,
        string _status
    );

    event StatusUpdated(
        string _uid,
        string _status
    );

    function insert(
        string calldata _uid,
        string calldata _productName,
        string calldata _producer,
        string calldata _status
    ) external returns (uint256) {
        Product memory newProduct = Product(
            _uid,
            block.timestamp,
            _productName,
            _producer,
            _status
        );
        products.push(newProduct);
        totalTransactions++;
        //emit event
        emit NewScanEvent(
            msg.sender,
            block.timestamp,
            _uid,
            _productName,
            _producer,
            _status
        );
        return totalTransactions;
    }

    function getProduct(string memory _uid) public view returns(string memory, string memory, string memory){
        for(uint256 i =0; i< totalTransactions; i++){
           if(compareStrings(products[i].uid, _uid)){
              //emit event
              return (products[i].productName , products[i].producer , products[i].status);
           }
       }
       revert("Product not found");
   }
     
    function compareStrings(string memory a, string memory b) public pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    function updateStatus(string memory _uid, string memory newStatus) public returns (bool){
       //This has a problem we need loop
       for(uint256 i =0; i< totalTransactions; i++){
           if(compareStrings(products[i].uid ,_uid)){
              products[i].status = newStatus;
              emit StatusUpdated(_uid, newStatus);
              return true;
           }
       }
       return false;
   }
}
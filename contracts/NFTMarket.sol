// contracts/NFTMarket.sol
// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "hardhat/console.sol";

contract NFTMarket is ReentrancyGuard {
  using Counters for Counters.Counter;
  Counters.Counter private _itemIds;
  Counters.Counter private _itemsSold;

  address owner;
  mapping(address => bool) admin;
  uint256 divPool;
  uint256 public totalShares;

  struct MarketItem {
    uint itemId;
    address nftContract;
    uint256 tokenId;
    address currentOwner;
    address beneficiary;
    uint256 price;
    uint256 timesSold;
    bool verifiedBeneficiary;
    uint256 beneficiaryBalance;
    uint256 shares;
    uint256 adminSetBeneficiaryCount;
    uint256 totalBeneficiaryBalance;
  }
  mapping(uint256 => MarketItem) private idToMarketItem;

  struct Divvies {
    uint _shareAmount;
    uint _divBalance;
    uint _withdrawnAmount;
    mapping(uint => uint) shareTracker; 
  }
  mapping(address => Divvies) public divTracker;

  // struct Shares {
  //    uint _itemId;
  //    uint _shareAmount;
  // }
  // mapping(address => Shares) public portfolioTracker;

  event MarketItemCreated (
    uint indexed itemId,
    address indexed nftContract,
    uint256 indexed tokenId,
    address currentOwner,
    address payable beneficiary,
    uint256 price,
    uint256 timesSold,
    bool verifiedBeneficiary,
    uint256 beneficiaryBalance,
    uint256 shares,
    uint256 adminSetBeneficiaryCount,
    uint256 totalBeneficiaryBalance
  );

  constructor() {
    owner = msg.sender;
    admin[msg.sender] = true;
  }

  modifier isAdmin {
    require(admin[msg.sender], "you are not an admin.");
    _;
  }

  function isUserAdmin(address _userAddress) public view returns(bool) {
    return admin[_userAddress];
  }
  /* Places an item for sale on the marketplace */
  function createMarketItem(address nftContract, uint256 tokenId) public payable nonReentrant isAdmin {
    // require(msg.sender == owner, "You cannot mint NFTs here.");
    _itemIds.increment();
    uint256 itemId = _itemIds.current();
    idToMarketItem[itemId] =  MarketItem(
      itemId,                     // itemId
      nftContract,                // nftContract
      tokenId,                    // tokenId
      msg.sender,                 // currentOwner 
      address(0),                      // beneficiary
      // 336666666666666 wei,        // price
      222222222222222 wei,        // price
      0,                          // timesSold
      false,                      // verifiedBeneficiary
      0,                          // beneficiaryBalance
      0,                          // shares
      0,                          // adminSetBeneficiaryCount
      0                           // totalBeneficiaryBalance
    );
    // Transfers ownership from msg.sender to this contract address. Add more functionality to allow
    // users to cancel listing
    address payable from = payable(msg.sender);
    IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
    emit MarketItemCreated(itemId,nftContract,tokenId,owner,from,222222222222222,0,false,0,0,0,0);
  }

  /* Creates the sale of a marketplace item */
  /* Transfers ownership of the item, as well as funds between parties */
  function createMarketSale(address nftContract, uint256 itemId, uint256 _shares) public payable nonReentrant {
    // uint price = idToMarketItem[itemId].price;
    uint tokenId = idToMarketItem[itemId].tokenId;
    require(msg.value >= idToMarketItem[itemId].price*_shares, "Please submit the asking price in order to complete the purchase");
    uint beneficiaryContribution; 
    uint divPoolContribution;
    beneficiaryContribution = msg.value/2;
    divPoolContribution = msg.value - beneficiaryContribution;
    divPool += divPoolContribution;
    idToMarketItem[itemId].beneficiaryBalance += beneficiaryContribution;
    idToMarketItem[itemId].totalBeneficiaryBalance += beneficiaryContribution;

    idToMarketItem[itemId].shares += _shares;
    // set currentOwner of idToMarketItem in our struct for book-keeping 
    idToMarketItem[itemId].currentOwner = msg.sender;
    // increments amount of times this nft has been purchased.
    idToMarketItem[itemId].timesSold + 1;
    // increase price by 1%
    uint numerator = idToMarketItem[itemId].price*100;
    idToMarketItem[itemId].price = idToMarketItem[itemId].price + numerator/10000;
    // buyer receives shares.
    divTracker[msg.sender]._shareAmount += _shares;
    totalShares += _shares;
    // adds purchased shareAmount to index of tokenId.
    divTracker[msg.sender].shareTracker[tokenId] += _shares;
    
    // this contract transfers ownership to msg.sender (a.k.a. buyer)
    // IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
    // Number of sales/share purchases made.
    _itemsSold.increment();
    // pays contract owner the listing price when nft sells.
  }

  /* Returns all unsold market items */
  function fetchMarketItems() public view returns (MarketItem[] memory) {
    uint itemCount = _itemIds.current();
    // uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
    uint currentIndex = 0;
    
    // An array of MarketItems of length 'itemCount'
    MarketItem[] memory items = new MarketItem[](itemCount);
    for (uint i = 0; i < itemCount; i++) {
      uint currentId = i + 1;
      MarketItem storage currentItem = idToMarketItem[currentId];
      items[currentIndex] = currentItem;
      currentIndex += 1;
      
    }
    return items;
  }

  /* Returns only items that a user has purchased */
  function fetchMyNFTs() public view returns (MarketItem[] memory) {
    uint totalItemCount = _itemIds.current();
    uint itemCount = 0;
    uint currentIndex = 0;
    for (uint i = 0; i < totalItemCount; i++) {
      if (divTracker[msg.sender].shareTracker[i + 1] != 0) {
        itemCount += 1;
      }
    }
    // An array of MarketItems of length 'itemCount'
    MarketItem[] memory items = new MarketItem[](itemCount);
    // uint[] memory shares = new uint[](itemCount);
    for (uint i = 0; i < totalItemCount; i++) {
      if (divTracker[msg.sender].shareTracker[i + 1] != 0) {
        uint currentId = i + 1;

        MarketItem storage currentItem = idToMarketItem[currentId];
        uint currentShares = divTracker[msg.sender].shareTracker[currentId];

        // shares[currentIndex] = currentShares;
        items[currentIndex] = currentItem;
        items[currentIndex].shares = currentShares;
        currentIndex += 1;
      }
    }
    return items;
  }

  // function fetchMyShares() public view returns (uint[] memory) {
  //   uint totalItemCount = _itemIds.current();
  //   uint itemCount = 0;
  //   uint currentIndex = 0;
  //   for (uint i = 0; i < totalItemCount; i++) {
  //     if (divTracker[msg.sender].shareTracker[i + 1] != 0) {
  //       itemCount += 1;
  //     }
  //   }
  //   // An array of MarketItems of length 'itemCount'
  //   // MarketItem[] memory items = new MarketItem[](itemCount);
  //   uint[] memory shares = new uint[](itemCount);
  //   for (uint i = 0; i < totalItemCount; i++) {
  //     if (divTracker[msg.sender].shareTracker[i + 1] != 0) {
  //       uint currentId = i + 1;

  //       // MarketItem storage currentItem = idToMarketItem[currentId];
  //       uint currentShares = divTracker[msg.sender].shareTracker[currentId];

  //       shares[currentIndex] = currentShares;
  //       // items[currentIndex] = currentItem;
  //       currentIndex += 1;
  //     }
  //   }
  //   return shares;
  // }


  /* Returns only items a user has created */
  function fetchItemsCreated() public view returns (MarketItem[] memory) {
    uint totalItemCount = _itemIds.current();
    uint itemCount = 0;
    uint currentIndex = 0;

    for (uint i = 0; i < totalItemCount; i++) {
      itemCount += 1;
      // if (idToMarketItem[i + 1].seller == msg.sender) {
      //   itemCount += 1; 
      // }
    }
    MarketItem[] memory items = new MarketItem[](itemCount);
    for (uint i = 0; i < totalItemCount; i++) {
      uint currentId = i + 1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
    }
    return items;
  }

  function updateDivvies(address _userAddress) public view returns(uint) {
        uint tempUserWithdrawAmount;
        uint tempNumerator;
        if (totalShares == 0 ) {
            tempUserWithdrawAmount = 0;
        } else {
            tempNumerator = divTracker[_userAddress]._shareAmount * divPool;
            tempUserWithdrawAmount = tempNumerator/totalShares - divTracker[_userAddress]._withdrawnAmount;  
        }  
        return tempUserWithdrawAmount;
    }

  function withdrawDivvies() public {
      address payable to = payable(msg.sender);
      uint tempUserWithdrawAmount;
      uint tempNumerator;
      if (totalShares == 0 ) {
          tempUserWithdrawAmount = 0;
      } else {
          // example to reference, but solidity can't do decimals
          // // tempUserKeyProportion = divTracker[_userAddress]._keyBalance/totalKeys;
          // // tempUserWithdrawAmount = tempUserKeyProportion*divPool - divTracker[_userAddress]._withdrawnAmount;

          tempNumerator = divTracker[msg.sender]._shareAmount * divPool;
          tempUserWithdrawAmount = tempNumerator/totalShares - divTracker[msg.sender]._withdrawnAmount;
          divTracker[msg.sender]._withdrawnAmount += tempUserWithdrawAmount;
      }  
      require(tempUserWithdrawAmount > 0, "You have no divvies to claim");
      to.transfer(tempUserWithdrawAmount);
  }

  function getUserTotalShares() public view returns(uint) {
    return divTracker[msg.sender]._shareAmount;
  }

  function setAdmin(address _adminAddress) public isAdmin {
    admin[_adminAddress] = true;
  }

  function setBeneficiaryByAdmin(address _beneficiaryAddress, uint256 itemId) public isAdmin returns(uint){
    require(idToMarketItem[itemId].adminSetBeneficiaryCount <= 2, "This nft is now in the hands of the beneficiary address.");
    idToMarketItem[itemId].beneficiary = _beneficiaryAddress;
    idToMarketItem[itemId].verifiedBeneficiary = true;
    idToMarketItem[itemId].adminSetBeneficiaryCount += 1;
    return idToMarketItem[itemId].adminSetBeneficiaryCount;
  }

  function setBeneficiaryByBeneficiary(address _beneficiaryAddress, uint256 itemId) public {
    require(msg.sender == idToMarketItem[itemId].beneficiary, "You are not the beneficiary of this nft.");
    idToMarketItem[itemId].beneficiary = _beneficiaryAddress;
    idToMarketItem[itemId].verifiedBeneficiary = true;
  }

  function withdrawBeneficiaryBalance(uint256 itemId) public {
    require(msg.sender == idToMarketItem[itemId].beneficiary, "You are not the beneficiary of this nft.");
    address payable to = payable(msg.sender);
    to.transfer(idToMarketItem[itemId].beneficiaryBalance);
    idToMarketItem[itemId].beneficiaryBalance = 0;
  }

}
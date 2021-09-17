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

  address payable owner;
  uint256 divPool;
  uint256 public totalShares;
  constructor() {
    owner = payable(msg.sender);
  }

  struct MarketItem {
    uint itemId;
    address nftContract;
    uint256 tokenId;
    // address payable seller;
    address currentOwner;
    address payable beneficiary;
    uint256 price;
    uint256 timesSold;
    bool verifiedBeneficiary;
    uint256 beneficiaryBalace;
  }
  mapping(uint256 => MarketItem) private idToMarketItem;

  struct Divvies {
    uint _shareAmount;
    uint _divBalance;
    uint _withdrawnAmount;
  }
  mapping(address => Divvies) public divTracker;

  event MarketItemCreated (
    uint indexed itemId,
    address indexed nftContract,
    uint256 indexed tokenId,
    // address payable seller,
    address currentOwner,
    address payable beneficiary,
    uint256 price,
    uint256 timesSold,
    bool verifiedBeneficiary,
    uint256 beneficiaryBalace
  );

  /* Returns the listing price of the contract */
  // function getListingPrice() public view returns (uint256) {
  //   return 0.05;
  // }

  /* Places an item for sale on the marketplace */
  function createMarketItem(address nftContract, uint256 tokenId, uint256 price) public payable nonReentrant {
    // require(msg.sender == owner, "You cannot mint NFTs here.");
    _itemIds.increment();
    uint256 itemId = _itemIds.current();
    idToMarketItem[itemId] =  MarketItem(
      itemId,                     // itemId
      nftContract,              // nftContract
      tokenId,                  // tokenId
      owner,                      // currentOwner 
      owner,                      // beneficiary
      price,                 // price
      0,                          // timesSold
      false,                      // verifiedBeneficiary
      0                           // beneficiaryBalace
    );
    // Transfers ownership from msg.sender to this contract address. Add more functionality to allow
    // users to cancel listing
    IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
    emit MarketItemCreated(itemId,nftContract,tokenId,owner,owner,price,0,false,0);
  }

  /* Creates the sale of a marketplace item */
  /* Transfers ownership of the item, as well as funds between parties */
  function createMarketSale(address nftContract, uint256 itemId, uint256 _shares) public payable nonReentrant {
    uint price = idToMarketItem[itemId].price;
    uint tokenId = idToMarketItem[itemId].tokenId;
    require(msg.value == price*_shares, "Please submit the asking price in order to complete the purchase");
    uint beneficiaryContribution; 
    uint divPoolContribution;
    beneficiaryContribution = msg.value/10;
    divPoolContribution = msg.value - beneficiaryContribution;
    divPool += divPoolContribution;
    idToMarketItem[itemId].beneficiaryBalace += beneficiaryContribution;
    
    // set currentOwner of idToMarketItem in our struct for book-keeping 
    idToMarketItem[itemId].currentOwner = msg.sender;
    // increments amount of times this nft has been purchased.
    idToMarketItem[itemId].timesSold + 1;
    // buyer receives shares.
    divTracker[msg.sender]._shareAmount += _shares;
    totalShares += _shares;
    
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

    MarketItem[] memory items = new MarketItem[](itemCount);
    for (uint i = 0; i < itemCount; i++) {
      uint currentId = i + 1;
      MarketItem storage currentItem = idToMarketItem[currentId];
      items[currentIndex] = currentItem;
      currentIndex += 1;
      // if (idToMarketItem[i + 1].owner == address(0)) {
      //   uint currentId = i + 1;
      //   MarketItem storage currentItem = idToMarketItem[currentId];
      //   items[currentIndex] = currentItem;
      //   currentIndex += 1;
      // }
    }
    return items;
  }

  /* Returns only items that a user has purchased */
  function fetchMyNFTs() public view returns (MarketItem[] memory) {
    uint totalItemCount = _itemIds.current();
    uint itemCount = 0;
    uint currentIndex = 0;

    for (uint i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].currentOwner == msg.sender) {
        itemCount += 1;
      }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);
    for (uint i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].currentOwner == msg.sender) {
        uint currentId = i + 1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

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
      // if (idToMarketItem[i + 1].seller == msg.sender) {
      //   uint currentId = i + 1;
      //   MarketItem storage currentItem = idToMarketItem[currentId];
      //   items[currentIndex] = currentItem;
      //   currentIndex += 1;
      // }
    }
    return items;
  }

}
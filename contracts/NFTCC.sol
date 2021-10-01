// contracts/NFT.sol
// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "hardhat/console.sol";

contract NFTCC is ERC721URIStorage {
    using Counters for Counters.Counter;
    // Counters.Counter private _tokenIds;
    Counters.Counter private _mintedTokenIds;
    address contractAddress;

    constructor(address marketplaceAddress) ERC721("Senators Carbon Copy", "SEN8CC") {
        // NFTMarketplace.sol will be allowed to transfer ownership of NTFs.
        contractAddress = marketplaceAddress;
    }
 // function createToken(string memory tokenURI) public returns (uint) {
    //     _tokenIds.increment();
    //     uint256 newItemId = _tokenIds.current();

    //     _mint(msg.sender, newItemId);
    //     _setTokenURI(newItemId, tokenURI);
    //     setApprovalForAll(contractAddress, true);
    //     return newItemId;
    // }
   

    function createMintedToken(string memory tokenURI) public returns (uint) {
        _mintedTokenIds.increment();
        uint256 newItemId = _mintedTokenIds.current();

        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        setApprovalForAll(contractAddress, true);
        return newItemId;
    }
}
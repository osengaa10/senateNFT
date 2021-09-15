/* test/sample-test.js */
describe("NFTMarket", function() {
  it("Should create and execute market sales", async function() {
    /* deploy the marketplace */
    // reference NFTMarket.sol
    const Market = await ethers.getContractFactory("NFTMarket")
    const market = await Market.deploy()
    // deploy NFTMarket.sol
    await market.deployed()
    // reference NFTMarket.sol address
    const marketAddress = market.address

    /* deploy the NFT contract */
    // reference NFT.sol
    const NFT = await ethers.getContractFactory("NFT")
    // deploy NFT.sol
    const nft = await NFT.deploy(marketAddress)
    await nft.deployed()
    // reference NFT.sol address
    const nftContractAddress = nft.address

    let listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString()

    const auctionPrice = ethers.utils.parseUnits('1', 'ether')

    /* create two tokens */
    // pass in URI of NFT tokens.
    await nft.createToken("https://www.mytokenlocation.com")
    await nft.createToken("https://www.mytokenlocation2.com")

    /* put both tokens for sale */
    await market.createMarketItem(nftContractAddress, 1, auctionPrice, { value: listingPrice })
    await market.createMarketItem(nftContractAddress, 2, auctionPrice, { value: listingPrice })
    // ethers.js baked in method to get as many theoretical addresses as needed.
    const [_, buyerAddress] = await ethers.getSigners()

    /* execute sale of token to another user */
    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, { value: auctionPrice})

    /* query for and return the unsold items */
    items = await market.fetchMarketItems()
    items = await Promise.all(items.map(async i => {
      const tokenUri = await nft.tokenURI(i.tokenId)
      let item = {
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenUri
      }
      return item
    }))
    console.log('items: ', items)
  })
})
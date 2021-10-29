/* pages/my-assets.js */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Web3Modal from "web3modal"
import {
  nftmarketaddress, nftaddress, nftccaddress
} from '../config'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTCC from '../artifacts/contracts/NFTCC.sol/NFTCC.json'
import { create as ipfsHttpClient } from 'ipfs-http-client'
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')



export default function MyAssets() {
  const router = useRouter()
  const [nfts, setNfts] = useState([])
  const [mintedNfts, setMintedNfts] = useState([])
  const[shares, setShares] = useState('')
  const[divvies, setDivvies] = useState('')
  const [fileUrl, setFileUrl] = useState(null)

  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadNFTs()
    loadMintedNFTs()
  }, [])
  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const accounts = await provider.listAccounts()
    const userAccount = accounts[0]

    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const nftData = await marketContract.fetchMyNFTs()
    const divvies = await marketContract.updateDivvies(userAccount)
    const shares = await marketContract.getUserTotalShares()
    // console.log("shares:")
    // console.log(shares.toString())
    setShares(shares.toString())
    let withdrawableDivvies = parseFloat(ethers.utils.formatUnits(divvies.toString(), 'ether')).toFixed(5)
    setDivvies(withdrawableDivvies)
    // console.log(withdrawableDivvies)

    const items = await Promise.all(nftData.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      console.log(i)
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
        shares: i.shares.toNumber()
      }
      return item
    }))
    console.log("fetchMyNFTs data:")
    console.log(nftData)
    setNfts(items)
    setLoadingState('loaded') 
  }

  async function loadMintedNFTs() {
    console.log("======loadMintedNFTs=======")
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const accounts = await provider.listAccounts()
    const userAccount = accounts[0]

    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    // const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const tokenContract = new ethers.Contract(nftccaddress, NFTCC.abi, provider)
    const nftData = await marketContract.fetchMyMintedNFTs()
    const divvies = await String(marketContract.updateDivvies(userAccount))
    console.log("divvies")
    console.log(divvies)
    const items = await Promise.all(nftData.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      // let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      console.log(i)
      let item = {
        tokenId: i.tokenId.toNumber(),
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name
      }
      return item
    }))
    console.log("==========fetchMy-MINTED-NFTs data==========")
    console.log(nftData)
    setMintedNfts(items)
    setLoadingState('loaded') 
  }

  async function withdrawDivvies() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const accounts = await provider.listAccounts()
    const userAccount = accounts[0]
    console.log("userAccount")
    console.log(userAccount)

    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const withdraw = await marketContract.withdrawDivvies()

  }


  /* Mints an NFT for the user who purchases shares */
  async function createMarket(nft) {
    console.log("createMarket")
    let name = nft.name
    let description = nft.description
    let fileUrl = nft.image
    console.log("nft.image: ", nft.image)
    const tokenId = nft.tokenId
    const origionalTokenId = tokenId

    if (!name || !description || !fileUrl ) return
    /* first, upload to IPFS */
    let fileName = '../img/'+nft.name.replace(/\s/g, '_')+'.png'
    console.log("fileName")
    console.log(fileName)
    let data = JSON.stringify({
      name, description, src: fileName, image: fileUrl
    })
    console.log("data")
    console.log(data)
    try {
      const added = await client.add(data)
      console.log("added: ", added)
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      setFileUrl(url)
      console.log("url: ", url)
      /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
      createSale(url, origionalTokenId)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  }
  async function createSale(url, origionalTokenId) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)    
    const signer = provider.getSigner()
    /* next, create the item */
    let contract = new ethers.Contract(nftccaddress, NFTCC.abi, signer)

    let transaction = await contract.createMintedToken(url)
    console.log("url (my-assets.js):")
    console.log(url)
    let tx = await transaction.wait()
    let event = tx.events[0]
    console.log("event")
    console.log(event)
    // let value = event.args[2]
    // let tokenId = value.toNumber()
 
    /* then list the item for sale on the marketplace */
    contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    transaction = await contract.createMintedMarketItem(nftaddress, origionalTokenId)
    await transaction.wait()
    router.push('/my-assets')
  }


  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No assets owned</h1>)
  return (
  <div>
      <div className="border-b p-6">
        <ul>
          <li><p className="text-4xl ml-4 font-bold">Shares: {shares.toString()}</p></li>
          <li><p className="text-4xl ml-4 font-bold">Divvies: {divvies} ETH</p></li>
        </ul>
        <button onClick={withdrawDivvies} className="ml-4 font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
          Withdraw Dividends
        </button>
      </div>
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">shares - {nft.shares}</p>
                  {nft.shares >= 10 ?
                  // <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={createMarket(nft)}>Mint NFT</button>
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => createMarket(nft)}>Mint NFT</button>
                  : false}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            mintedNfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">{nft.name}~CC</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  </div>
  )
}
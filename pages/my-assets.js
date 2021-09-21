/* pages/my-assets.js */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
  nftmarketaddress, nftaddress
} from '../config'

import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'


export default function MyAssets() {
  const [nfts, setNfts] = useState([])
  const[shares, setShares] = useState('')
  const[divvies, setDivvies] = useState('')

  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadNFTs()
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
    console.log("userAccount")
    console.log(userAccount)

    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const nftData = await marketContract.fetchMyNFTs()
    const divvies = await marketContract.updateDivvies(userAccount)
    const shares = await marketContract.getUserTotalShares()
    console.log("shares:")
    console.log(shares.toString())
    setShares(shares.toString())
    let withdrawableDivvies = ethers.utils.formatUnits(divvies.toString(), 'ether')
    setDivvies(withdrawableDivvies)
    console.log(withdrawableDivvies)

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
        shares: i.shares.toNumber()
      }
      return item
    }))
    console.log("fetchMyNFTs data:")
    console.log(nftData)
    setNfts(items)
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


  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No assets owned</h1>)
  return (
    <div>
    {/* <nav className="border-b p-6"> */}
      <div className="border-b p-6">
        <ul>
          <li><p className="text-4xl ml-4 font-bold">Shares: {shares.toString()}</p></li>
          <li><p className="text-4xl ml-4 font-bold">Divvies: {divvies} ETH</p></li>
        </ul>
        <button onClick={withdrawDivvies} className="ml-4 font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
          Withdraw Dividends
        </button>
      </div>
    {/* </nav> */}
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">shares - {nft.shares}</p>
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
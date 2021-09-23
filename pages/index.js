/* pages/index.js */
import { ethers } from 'ethers'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import { nftaddress, nftmarketaddress } from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

export default function Home() {
  const router = useRouter()
  const [nfts, setNfts] = useState([])
  const [shareAmount, setShareAmount] = useState(0)
  const [loadingState, setLoadingState] = useState('not-loaded')
  const[isAdmin, setIsAdmin] = useState(false)
  const[userAccount, setUserAccount] = useState('')

  useEffect(() => {
    loadNFTs()
    loadAccounts()
  }, [])

  async function loadAccounts() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    let accounts = await provider.listAccounts()
    const connectedUserAccount = accounts[0]
    setUserAccount(String(connectedUserAccount))
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const admin = await marketContract.isUserAdmin(connectedUserAccount)
    setIsAdmin(admin)
  }

  async function loadNFTs() {
    /* create a generic provider and query for unsold market items */
    const provider = new ethers.providers.JsonRpcProvider()
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const data = await marketContract.fetchMarketItems()
    /*
    *  map over items returned from smart contract and format 
    *  them as well as fetch their token metadata
    */
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let beneficiaryBalance = ethers.utils.formatUnits(i.beneficiaryBalance.toString(), 'ether')
      let totalBeneficiaryBalance = ethers.utils.formatUnits(i.totalBeneficiaryBalance.toString(), 'ether')
      // console.log("totalBeneficiaryBalance")
      // console.log(totalBeneficiaryBalance)
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
        beneficiaryBalance: beneficiaryBalance,
        shares: i.shares.toNumber(),
        verifiedBeneficiary: i.verifiedBeneficiary,
        beneficiary: i.beneficiary,
        totalBeneficiaryBalance: totalBeneficiaryBalance
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded') 
  }
  console.log(nfts)
  function handleInput(e) {
    setShareAmount(e.target.value);
}
  async function buyNft(nft) {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    /* user will be prompted to pay the asking proces to complete the transaction */
    const totalAmount = nft.price*shareAmount
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
    console.log(String(ethers.utils.parseEther(totalAmount.toString())))
    const totalPrice = ethers.utils.parseUnits(totalAmount.toString(), 'ether')
    const _amount = parseInt(shareAmount);
    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, shareAmount, {
      value: totalPrice
    })
    await transaction.wait()
    loadNFTs()
  }
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>)
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4" style={{alignItems: 'center'}}>
          {
            nfts.map((nft, i) => (  
              
              <div key={i} className="row border shadow rounded-xl overflow-hidden">
                {isAdmin ? 
                <Link href="/edit-item/" as={`/edit-item/${i+1}`}>
                  <div>
                    <img src={nft.image} />
                  </div>
                </Link>
                :<img src={nft.image} />
                }
                {nft.verifiedBeneficiary == true ?
                  // <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="green" className="bi bi-person-check-fill" viewBox="0 0 16 16">
                  //   <path fillRule="evenodd" d="M15.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L12.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                  //   <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                  // </svg> 
                  <p className="text-xl" style={{color: 'green', textAlign: 'center'}}>Verified</p>
                  : <p className="text-xl" style={{color: 'red', textAlign: 'center'}}>Not verified</p>
                }
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                  <p className="text-gray-400">Total Shares Bought: {nft.shares}</p>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <div className="d-flex flex-nowrap ">
                  <input
                    type="number"
                    placeholder="Shares to purchase"
                    className="mt-2 border rounded p-2"
                    onChange={handleInput}
                  />
                  <button className="ml-2 bg-pink-500 text-white font-bold py-2 px-2 rounded" onClick={() => buyNft(nft)}>Buy</button>
                  </div>
                  <p className="text-2xl mb-4 font-bold text-white">Share Price: {parseFloat(nft.price).toFixed(5)} ETH</p>
                  <p className="text-2xl mb-4 font-bold text-white">Total: {parseFloat(nft.totalBeneficiaryBalance).toFixed(5)} ETH</p>
                  {userAccount == nft.beneficiary ? 
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Claim {parseFloat(nft.beneficiaryBalance).toFixed(5)} ETH</button>
                : false}
                </div>
              </div>              
            ))
          }
        </div>
      </div>
    </div>
  )
}
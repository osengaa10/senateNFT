/* pages/_app.js */
import '../styles/globals.css'
import Link from 'next/link'

import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import { nftaddress, nftmarketaddress } from '../config'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

function MyApp({ Component, pageProps }) {
  const[isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    loadAccounts()
  })

  async function loadAccounts() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    let accounts = await provider.listAccounts()
    const userAccount = accounts[0]
    console.log(userAccount)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const admin = await marketContract.isUserAdmin(userAccount)
    console.log("admin: ")
    console.log(admin)
    setIsAdmin(admin)
  }
  
  console.log("userAccount from _app.js: ")
  if (isAdmin) {
    return (
      <div>
        <nav className="border-b p-6">
          <p className="text-4xl font-bold">Metaverse Marketplace</p>
          <div className="flex mt-4">
            <Link href="/">
              <a className="mr-4 text-pink-500">
                Marketplace
              </a>
            </Link>
            <Link href="/my-assets">
              <a className="mr-6 text-pink-500">
                My Digital Assets
              </a>
            </Link>
            <Link href="/creator-dashboard">
              <a className="mr-6 text-pink-500">
                Creator Dashboard
              </a>
            </Link>
            <Link href="/create-item">
              <a className="mr-6 text-pink-500">
                Admin Dashboard
              </a>
            </Link>
          </div>
        </nav>
        <Component {...pageProps} />
      </div>
    )
  } else {
    return (
      <div>
        <nav className="border-b p-6">
          <p className="text-4xl font-bold">Metaverse Marketplace</p>
          <div className="flex mt-4">
            <Link href="/">
              <a className="mr-4 text-pink-500">
                Marketplace
              </a>
            </Link>
            <Link href="/my-assets">
              <a className="mr-6 text-pink-500">
                My Digital Assets
              </a>
            </Link>
            <Link href="/creator-dashboard">
              <a className="mr-6 text-pink-500">
                Creator Dashboard
              </a>
            </Link>
          </div>
        </nav>
        <Component {...pageProps} />
      </div>
    )
  }
}

export default MyApp
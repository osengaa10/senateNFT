/* pages/create-item.js */
import { useState } from 'react'
import { ethers } from 'ethers'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'

import {
    nftaddress, nftmarketaddress
  } from '../config'

import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

export default function EditItem() {
//   const [formInput, updateFormInput] = useState({ beneficiary: '', description: '' })
  const [beneficiary, setBeneficiary] = useState('')
  // Yes I'm aware that below is an absolutely rediculous way to get the tokenId from the URL.
  // I'm tired I'll come back to this.
  const router = useRouter()
  const value = router.asPath[router.asPath.length - 1]
  const tokenId = Number(value)

  function handleInput(e) {
    setBeneficiary(e.target.value);
}

  async function adminSetBeneficiary() {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    let tx = await contract.setBeneficiaryByAdmin(beneficiary, tokenId)
    await tx.wait()
    router.push('/')
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input 
          placeholder="Beneficiary Address"
          className="mt-8 border rounded p-4"
          onChange={handleInput}
        />        
        <button onClick={adminSetBeneficiary} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
          Apply Changes
        </button>
      </div>
    </div>
  )
}
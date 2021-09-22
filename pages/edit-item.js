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
  const router = useRouter()
  console.log(router)
  console.log(router.asPath[router.asPath.length - 1])
  const value = router.asPath[router.asPath.length - 1]
  const tokenId = Number(value)
  function handleInput(e) {
    let bene = e.target.value;
    console.log("bene");
    // console.log(timeLeft.toNumber());
    setBeneficiary(e.target.value);
    console.log(beneficiary);
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
        {/* <input 
          placeholder="Beneficiary Address"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, beneficiary: e.target.value })}
        /> */}
        <input 
          placeholder="Beneficiary Address"
          className="mt-8 border rounded p-4"
          onChange={handleInput}
        />        
        {/* <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        /> */}
        <button onClick={adminSetBeneficiary} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
          Apply Changes
        </button>
      </div>
    </div>
  )
}
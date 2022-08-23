import React, { useState, useEffect } from 'react'
import "../assets/css/styles.css";
import NavBar from "../components/NavBar";
import { useSelector } from "react-redux";
import { ethers } from "ethers";
import { Form } from "react-bootstrap";
import { Button } from '@mui/material';
import { CircularProgress } from "@mui/material"

import nftContract from "../artifacts/NftContract.sol/NFTNormal.json";
import { contractAddress, networkDeployedTo } from "../utils/contracts-config";
import networksMap from "../utils/networksMap.json";
import { CollectionConfig } from "../utils/CollectionConfig"

function OwnerDashboard() {
  const data = useSelector((state) => state.blockchain.value)

  const [mintingState, setMintingState] = useState({
    balance: 0,
    maxMintAmountPerTx: 1,
    mintCost: 0,
    paused: true,
    whitelisting: false,
    presale: false,
    publicSale: false
  })
  const [loading, setLoading] = useState(false)

  const getMintingState = async () => {
    if (data.network === networksMap[networkDeployedTo]) {
      const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const nft_contract = new ethers.Contract(contractAddress, nftContract.abi, provider);

      const _balance = await provider.getBalance(contractAddress);
      const paused = await nft_contract.paused()
      const revealed = await nft_contract.revealed()
      const whitelisting = await nft_contract.whitelistMintEnabled()
      const maxMintAmountPerTx = await nft_contract.maxMintAmountPerTx()
      const cost = await nft_contract.cost()

      setMintingState({
        balance: ethers.utils.formatUnits(_balance, "ether"),
        maxMintAmountPerTx: Number(maxMintAmountPerTx),
        mintCost: Number(ethers.utils.formatUnits(cost, "ether")),
        paused: paused,
        whitelisting: whitelisting,
        presale: ((!revealed && !whitelisting) && !paused),
        publicSale: revealed
      })
    }
  }

  const changeMintCost = async () => {
    if (data.network === networksMap[networkDeployedTo]) {
      try {
        setLoading(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const signer = provider.getSigner()
        const nft_contract = new ethers.Contract(contractAddress, nftContract.abi, signer);

        const _newCost = ethers.utils.parseEther(String(mintingState.mintCost), "ether")
        const change_tx = await nft_contract.setCost(_newCost)
        await change_tx.wait()

        setLoading(false)
        getMintingState()

      } catch (error) {
        setLoading(false)
        window.alert("An error has occured, Please Try Again")
        console.log(error)
      }
    }
  }

  const changeMaxMintAmount = async () => {
    if (data.network === networksMap[networkDeployedTo]) {
      try {
        setLoading(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const signer = provider.getSigner()
        const nft_contract = new ethers.Contract(contractAddress, nftContract.abi, signer);

        const change_tx = await nft_contract.setMaxMintAmountPerTx(Number(mintingState.maxMintAmountPerTx))
        await change_tx.wait()

        setLoading(false)
        getMintingState()

      } catch (error) {
        setLoading(false)
        window.alert("An error has occured, Please Try Again")
        console.log(error)
      }
    }
  }

  const startWhitelisting = async () => {
    if (data.network === networksMap[networkDeployedTo] && mintingState.paused) {
      if (!mintingState.whitelisting) {
        try {
          setLoading(true)
          const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
          const signer = provider.getSigner()
          const nft_contract = new ethers.Contract(contractAddress, nftContract.abi, signer);

          console.log("starting whitelist sale")

          const unpause_tx = await nft_contract.pause(false)
          await unpause_tx.wait()

          const whitelist_tx = await nft_contract.setWhitelistMintEnabled(true)
          await whitelist_tx.wait()

          setLoading(false)
          getMintingState()
        } catch (error) {
          setLoading(false)
          window.alert("An error has occured, Please Try Again")
          console.log(error)
        }
      }
    }
  }

  const startPresale = async () => {
    if (data.network === networksMap[networkDeployedTo] && mintingState.whitelisting) {
      try {
        setLoading(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const signer = provider.getSigner()
        const nft_contract = new ethers.Contract(contractAddress, nftContract.abi, signer);

        let newCost = ethers.utils.parseEther(CollectionConfig.preSale.price.toString(), "ether")
        let maxMintAmount = CollectionConfig.preSale.maxMintAmountPerTx

        const stop_whitelist_tx = await nft_contract.setWhitelistMintEnabled(false)
        await stop_whitelist_tx.wait()

        const set_tx = await nft_contract.setCost(newCost)
        await set_tx.wait()

        const set_tx2 = await nft_contract.setMaxMintAmountPerTx(maxMintAmount)
        await set_tx2.wait()

        setLoading(false)
        getMintingState()

      } catch (error) {
        setLoading(false)
        window.alert("An error has occured, Please Try Again")
        console.log(error)
      }
    }
  }

  const startPublicSale = async () => {
    if (data.network === networksMap[networkDeployedTo] && mintingState.presale) {
      try {
        setLoading(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const signer = provider.getSigner()
        const nft_contract = new ethers.Contract(contractAddress, nftContract.abi, signer);

        let newCost = ethers.utils.parseEther(CollectionConfig.publicSale.price.toString(), "ether")
        let maxMintAmount = CollectionConfig.publicSale.maxMintAmountPerTx

        const reveal_tx = await nft_contract.reveal(CollectionConfig.baseMetadataURI)
        await reveal_tx.wait()

        const set_tx = await nft_contract.setCost(newCost)
        await set_tx.wait()

        const set_tx2 = await nft_contract.setMaxMintAmountPerTx(maxMintAmount)
        await set_tx2.wait()

        setLoading(false)
        getMintingState()

      } catch (error) {
        setLoading(false)
        window.alert("An error has occured, Please Try Again")
        console.log(error)
      }
    }
  }

  const withdraw = async () => {
    if (data.network === networksMap[networkDeployedTo] && mintingState.presale) {
      try {
        setLoading(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const signer = provider.getSigner()
        const nft_contract = new ethers.Contract(contractAddress, nftContract.abi, signer);

        const withdraw_tx = await nft_contract.withdraw()
        await withdraw_tx.wait()

        setLoading(false)
        getMintingState()
      } catch (error) {
        setLoading(false)
        window.alert("An error has occured, Please Try Again")
        console.log(error)
      }
    }
  }

  useEffect(() => {
    getMintingState()
  }, [])


  return (
    <div className="dashboard" >
      <NavBar />
      <div className="dashboard-section">
        <h1>Owner Dashboard</h1>
        <div className="dashboard-container">
          {mintingState.paused ? (
            <div className="dashboard-content">
              <div className='dashboard-row' >
                <div className='dashboard-left'>
                  <label>Current contract balance : {mintingState.balance} ETH</label>
                </div>
                <div className='dashboard-button-up'>
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={withdraw}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "withdraw"}
                  </Button>
                </div>
              </div>
              <br />
              <div className='dashboard-row'>
                <div className='dashboard-left'>
                  <label>Max Nft minted per transaction : </label>
                  <Form.Control type="Number"
                    value={mintingState.maxMintAmountPerTx}
                    onChange={(e) => setMintingState({ ...mintingState, maxMintAmountPerTx: e.target.value })}
                  />
                </div>
                <div className='dashboard-button' >
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={changeMaxMintAmount}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "Change"}
                  </Button>
                </div>
              </div>
              <br />
              <div className='dashboard-row'>
                <div className='dashboard-left'>
                  <label>NFT mint cost (ETH) : </label>
                  <Form.Control type="Number"
                    value={mintingState.mintCost}
                    onChange={(e) => setMintingState({ ...mintingState, mintCost: e.target.value })}
                  />
                </div>
                <div className='dashboard-button' >
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={changeMintCost}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "Change"}
                  </Button>
                </div>
              </div>
              <br />
              <br />
              <div className='dashboard-row'>
                <div className='dashboard-left'>
                  <label>Nft Contract is paused </label>
                </div>
                <div className='dashboard-button-up'>
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={startWhitelisting}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "Start Whitelisting"}
                  </Button>
                </div>
              </div>
            </div>
          ) : mintingState.whitelisting ? (
            <div className="dashboard-content">
              <div className='dashboard-row'>
                <div className='dashboard-left'>
                  <label>Current contract balance : {mintingState.balance} ETH</label>
                </div>
                <div className='dashboard-button-up'>
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={withdraw}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "withdraw"}
                  </Button>
                </div>
              </div>
              <br />
              <div className='dashboard-row'>

                <div className='dashboard-left'>
                  <label>Max Nft minted per transaction : </label>
                  <Form.Control type="Number"
                    value={mintingState.maxMintAmountPerTx}
                    onChange={(e) => setMintingState({ ...mintingState, maxMintAmountPerTx: e.target.value })}
                  />
                </div>
                <div className='dashboard-button' >
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={changeMaxMintAmount}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "Change"}
                  </Button>
                </div>
              </div>
              <br />
              <div className='dashboard-row'>
                <div className='dashboard-left'>
                  <label>NFT mint cost (ETH) : </label>
                  <Form.Control type="Number"
                    value={mintingState.mintCost}
                    onChange={(e) => setMintingState({ ...mintingState, mintCost: e.target.value })}
                  />
                </div>
                <div className='dashboard-button' >
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={changeMintCost}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "Change"}
                  </Button>
                </div>
              </div>
              <br />
              <br />
              <div className='dashboard-row'>
                <div className='dashboard-left'>
                  <label>Nft Contract is in whitelisting state </label>
                </div>
                <div className='dashboard-button-up'>
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={startPresale}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "Start Presale"}
                  </Button>
                </div>
              </div>
            </div>
          ) : mintingState.presale ? (
            <div className="dashboard-content">
              <div className='dashboard-row'>
                <div className='dashboard-left'>
                  <label>Current contract balance : {mintingState.balance} ETH</label>
                </div>
                <div className='dashboard-button-up'>
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={withdraw}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "withdraw"}
                  </Button>
                </div>
              </div>
              <br />
              <div className='dashboard-row'>

                <div className='dashboard-left'>
                  <label>Max Nft minted per transaction : </label>
                  <Form.Control type="Number"
                    value={mintingState.maxMintAmountPerTx}
                    onChange={(e) => setMintingState({ ...mintingState, maxMintAmountPerTx: e.target.value })}
                  />
                </div>
                <div className='dashboard-button' >
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={changeMaxMintAmount}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "Change"}
                  </Button>
                </div>
              </div>
              <br />
              <div className='dashboard-row'>
                <div className='dashboard-left'>
                  <label>NFT mint cost (ETH) : </label>
                  <Form.Control type="Number"
                    value={mintingState.mintCost}
                    onChange={(e) => setMintingState({ ...mintingState, mintCost: e.target.value })}
                  />
                </div>
                <div className='dashboard-button' >
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={changeMintCost}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "Change"}
                  </Button>
                </div>
              </div>
              <br />
              <br />
              <div className='dashboard-row'>
                <div className='dashboard-left'>
                  <label>Nft Contract is in presale mode </label>
                </div>
                <div className='da'>
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={startPublicSale}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "Start PublicSale"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="dashboard-content">
              <div className='dashboard-row'>
                <div className='dashboard-left'>
                  <label>Current contract balance : {mintingState.balance} ETH</label>
                </div>
                <div className='dashboard-button-up'>
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={withdraw}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "withdraw"}
                  </Button>
                </div>
              </div>
              <br />
              <div className='dashboard-row'>

                <div className='dashboard-left'>
                  <label>Max Nft minted per transaction : </label>
                  <Form.Control type="Number"
                    value={mintingState.maxMintAmountPerTx}
                    onChange={(e) => setMintingState({ ...mintingState, maxMintAmountPerTx: e.target.value })}
                  />
                </div>
                <div className='dashboard-button' >
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={changeMaxMintAmount}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "Change"}
                  </Button>
                </div>
              </div>
              <br />
              <div className='dashboard-row'>
                <div className='dashboard-left'>
                  <label>NFT mint cost (ETH) : </label>
                  <Form.Control type="Number"
                    value={mintingState.mintCost}
                    onChange={(e) => setMintingState({ ...mintingState, mintCost: e.target.value })}
                  />
                </div>
                <div className='dashboard-button' >
                  <Button className='bt-linear'
                    variant="contained"
                    color="primary"
                    onClick={changeMintCost}>
                    {loading ? <CircularProgress color="inherit" size={18} /> : "Change"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div >
    </div>
  )
}

export default OwnerDashboard;

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import ReactLoading from 'react-loading';

import abi from "./utils/WavePortal.json"

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [wavesCount, setWavesCount] = useState("0");
  const [allWaves, setAllWaves] = useState([]);
  const [waveMessage, setWaveMessage] = useState("");
  const [displayWarning, setDisplayWarning] = useState(false);
  const [minting, setMinting] = useState(false);

  const contractAddress = "0x899B43b9fDD6429bF64E3d5EF149413B6637d7aa";
  const contractABI = abi.abi;
  
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getAllWaves = async () => {
    try{
      const {ethereum} = window;
      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const waveportalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await waveportalContract.getAllWaves();

        let count = await waveportalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setWavesCount(count.toNumber());

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });
        console.log(wavesCleaned);
        let sortedWaves = wavesCleaned.sort((a,b) => b.timestamp - a.timestamp);
        setAllWaves(sortedWaves);

        waveportalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves(prevState => [...prevState, {
            address:from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);
        });
      }
      else{
        console.log("Ethereum object doesn't exist!");
      }
      }
      catch(err){
        console.log(err);
      }
    }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    setWaveMessage("");
    if(!/^(spotify:|https:\/\/[a-z]+\.spotify\.com\/)/.test(waveMessage)){
      console.log("No Link Found!");
      setDisplayWarning(true);
      return;
    }
    else{
      setDisplayWarning(false);
    }
    try{
      const {ethereum} = window;

      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const waveportalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waveTxn = await waveportalContract.wave(waveMessage, { gasLimit: 300000 })
        console.log("Minting...", waveTxn.hash);
        setMinting(true);

        await waveTxn.wait();
        console.log("Minted -- ", waveTxn.hash);
        setMinting(false);

        let count = await waveportalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setWavesCount(count.toNumber());
        await getAllWaves();
      }
      else{
        console.log("Ethereum object doesn't exist");
      }
    }
    catch(err){
      console.log(err);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  useEffect(() => {
    getAllWaves();
  }, [])
  
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        👋 I'd love to hear some new music!
        </div>

        <div className="bio">
          I am Will and I am a PM that codes :) Connect your Ethereum wallet and drop a Spotify link to be stored on the blockchain!
        </div>
        <div style={{textAlign: "center", marginTop: "20px"}}>
        Number of Waves: {wavesCount}
        </div>
        <div>
          {!currentAccount ? (
            <button className="waveButton" onClick={connectWallet}>
              Connect Wallet
            </button>
          )
          :
          (
          <div>
            <div style = {{textAlign: "center"}}>
              <input type="url" placeholder="Spotify Link" style={{margin: "10px"}} value={waveMessage} onChange={e => setWaveMessage(e.target.value)}/>
              <button className="waveButton" onClick={wave}>
                Wave at Me
              </button>
            </div>
            {displayWarning && 
              <p style= {{color: "red", textAlign: "center"}}>
                Please submit a valid Spotify Link!
              </p>
            }
            {minting &&
            <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                <ReactLoading type={"cubes"} color={"green"} height={'20%'} width={'20%'} />
              </div>
            }
            <h3 style={{textAlign: "center"}}>
            Spotify Songs 
            </h3>
            {allWaves.map((_wave, _index) => {
              return (
                <div key={_index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
                  <div><b>Address:</b> {_wave.address}</div>
                  <div><b>Time:</b> {_wave.timestamp.toString()}</div>
                  <div><b>Song Link:</b> {_wave.message}</div>
                </div>)
            })}
          </div>
          )
          }
        </div>  
      </div>
    </div>
  );
}

export default App
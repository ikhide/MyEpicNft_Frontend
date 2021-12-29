import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import myEpicNft from "./utils/MyEpicNFT.json";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";

// Constants
const TWITTER_HANDLE = "AtakpuGodson";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0xaEC9E80280415655c60116321Bd5B380B338eb5a";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState("");
  const [tokenIds, setTokenIds] = useState("");

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfOnCorrectNetwork();
  });

  useEffect(() => {
    initContract();
  }, [currentAccount]);
  useEffect(() => {
    fetchNftList();
  }, [contract]);
  // Render Methods

  const initContract = async () => {
    try {
      if (currentAccount) {
        const { ethereum } = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        setContract(connectedContract);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    /*
     * First make sure we have access to window.ethereum
     */
    const { ethereum } = window;

    if (!ethereum) {
      alert("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    /*
     * Check if we're authorized to access the user's wallet
     */
    const accounts = await ethereum.request({ method: "eth_accounts" });
    console.log(accounts);

    /*
     * User can have multiple authorized accounts, we grab the first one if its there!
     */
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);

      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  /*
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
       * Fancy method to request access to account.
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      /*
       * Boom! This should print out public address once we authorize Metamask.
       */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  //MInt NFT
  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        let totalMinted = await contract.getTotalNFTsMintedSoFar();
        console.log("Total Minted", totalMinted);
        if (totalMinted > TOTAL_MINT_COUNT) {
          alert("You have already minted the maximum number of NFTs!");
          return;
        }
        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await contract.makeAnEpicNFT();

        console.log("Mining...please wait.");
        setIsLoading(true);
        await nftTxn.wait();

        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
        fetchNftList();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        contract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          setIsLoading(false);
          alert(
            `Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });

        contract.on("MintError", (from, message) => {
          console.log(from, message);
          setIsLoading(false);
          alert(`${message}`);
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfOnCorrectNetwork = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        let chainId = await ethereum.request({ method: "eth_chainId" });
        console.log("Connected to chain " + chainId);

        // String, hex code of the chainId of the Rinkebey test network
        const rinkebyChainId = "0x4";
        if (chainId !== rinkebyChainId) {
          alert("You are not connected to the Rinkeby Test Network!");
        }
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchNftList = async () => {
    try {
      if (contract) {
        let ownerIds = await contract.getUserTokenIds();
        let idArray = [];
        ownerIds &&
          ownerIds.map((data) => {
            console.log(data.name);
            return idArray.push({
              name: data.name.toString(),
              id: data.tokenId.toNumber(),
            });
          });
        setTokenIds(idArray);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const viewOnOpenSea = (tokenId) => {
    window.open(
      ` https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId}`
    );
  };

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  /*
   * This runs our function when the page loads.
   */

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (
            <button
              onClick={askContractToMintNft}
              className="cta-button connect-wallet-button"
            >
              Mint NFT
            </button>
          )}
        </div>
        <div
          style={{
            display: isLoading ? "flex" : "none",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <Loader
            type="Puff"
            color="#60c657"
            height={50}
            width={50}
            // timeout={3000} //3 secs
          />
          <p style={{ color: "#fff" }}>Minting, please wait.</p>
        </div>

        <div className="collection">
          {tokenIds &&
            tokenIds.map((tokenId) => {
              return (
                <button
                  onClick={() => viewOnOpenSea(tokenId.id)}
                  className="collectionItem connect-wallet-button"
                >
                  {tokenId.name}
                </button>
              );
            })}
        </div>

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;

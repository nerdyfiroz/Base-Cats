/*********************************
 * CONFIG
 *********************************/
const CONTRACT_ADDRESS = "0xFED68aE5123369Ed79EE210596368B3B5fEdDb63";
const BASE_CHAIN_ID = "0x2105";
const MINT_TIME = new Date("2026-01-20T16:00:00Z").getTime(); // BD 10 PM

// PHASE CONFIG
const PHASE_LIMIT = {
  gtd: 1,
  fcfs: 1,
  public: 1,
};

let CURRENT_PHASE = "gtd"; // gtd | fcfs | public

/*********************************
 * ELEMENTS
 *********************************/
const countdownEl = document.getElementById("countdown");
const statusEl = document.getElementById("status");
const mintBtn = document.getElementById("mintBtn");
const connectBtn = document.getElementById("connectBtn");

/*********************************
 * CONTRACT ABI (MINIMAL)
 *********************************/
const ABI = [
  "function mint(uint256 amount) public",
  "function balanceOf(address owner) view returns (uint256)"
];

let provider, signer, contract, userAddress;

/*********************************
 * COUNTDOWN
 *********************************/
function startCountdown() {
  const timer = setInterval(() => {
    const diff = MINT_TIME - Date.now();

    if (diff <= 0) {
      clearInterval(timer);
      countdownEl.innerText = "🟢 Mint is live";
      if (userAddress) mintBtn.style.display = "block";
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    countdownEl.innerText =
      `⏳ Mint starts in ${d}d ${h}h ${m}m ${s}s`;
  }, 1000);
}

startCountdown();

/*********************************
 * SWITCH TO BASE
 *********************************/
async function switchToBase() {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_ID }],
    });
    return true;
  } catch (err) {
    if (err.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: BASE_CHAIN_ID,
          chainName: "Base",
          rpcUrls: ["https://mainnet.base.org"],
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          blockExplorerUrls: ["https://basescan.org"],
        }],
      });
      return true;
    }
    return false;
  }
}

/*********************************
 * CONNECT WALLET
 *********************************/
async function connectWallet() {
  if (!window.ethereum) {
    alert("Install MetaMask / Web3 Wallet");
    return;
  }

  statusEl.innerText = "🔌 Connecting wallet...";

  await ethereum.request({ method: "eth_requestAccounts" });
  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();

  const switched = await switchToBase();
  if (!switched) {
    statusEl.innerText = "❌ Switch to Base network";
    return;
  }

  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  connectBtn.style.display = "none";
  statusEl.innerText = `✅ Connected: ${userAddress.slice(0,6)}...`;

  if (Date.now() >= MINT_TIME) {
    mintBtn.style.display = "block";
  }
}

/*********************************
 * GET PHASE LIMIT
 *********************************/
function getMaxMint() {
  return PHASE_LIMIT[CURRENT_PHASE];
}

/*********************************
 * REAL MINT FUNCTION
 *********************************/
async function mintNFT() {
  try {
    if (Date.now() < MINT_TIME) {
      alert("Mint not live yet");
      return;
    }

    statusEl.innerText = "⏳ Checking mint limit...";

    const minted = await contract.balanceOf(userAddress);
    const maxMint = getMaxMint();

    if (minted.toNumber() >= maxMint) {
      statusEl.innerText = "❌ Mint limit reached";
      return;
    }

    // Base current gas price
    const gasPrice = await provider.getGasPrice();

    statusEl.innerText = "🚀 Minting... confirm in wallet";

    const tx = await contract.mint(1, {
      gasPrice,
    });

    await tx.wait();

    statusEl.innerText = "🎉 Mint successful!";
    mintBtn.style.display = "none";

  } catch (err) {
    console.error(err);
    statusEl.innerText = "❌ Mint failed or rejected";
  }
}

/*********************************
 * MOBILE FIX
 *********************************/
if (window.ethereum) {
  ethereum.on("chainChanged", async () => {
    if (!signer) return;
    userAddress = await signer.getAddress();
    if (Date.now() >= MINT_TIME) mintBtn.style.display = "block";
  });
}

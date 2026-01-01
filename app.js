/*************************************************
 * BASE CATS – FINAL MINT LOGIC
 * - Force Base chain (8453)
 * - Wallet connect
 * - Whitelist check
 * - Mint schedule (time lock)
 * - Free mint (gas only)
 *************************************************/

// =====================
// 🔗 CONTRACT INFO
// =====================
const CONTRACT_ADDRESS = "0xFED68aE5123369Ed79EE210596368B3B5fEdDb63";

const ABI = [
  "function whitelistMint() external"
];

// =====================
// 🔵 BASE CHAIN CONFIG
// =====================
const BASE_CHAIN_ID = "0x2105"; // 8453 (Base Mainnet)

// =====================
// ⏰ MINT DATE (UTC)
// =====================
// Example: 20 Jan 2025, 18:00 UTC
const MINT_TIME = new Date("2025-01-20T18:00:00Z").getTime();

// =====================
// GLOBALS
// =====================
let provider;
let signer;
let userAddress;

// =====================
// 🔄 SWITCH TO BASE
// =====================
async function switchToBase() {
  const currentChain = await window.ethereum.request({
    method: "eth_chainId"
  });

  if (currentChain === BASE_CHAIN_ID) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_ID }]
    });
  } catch (err) {
    // Base not added → add it
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: BASE_CHAIN_ID,
          chainName: "Base",
          rpcUrls: ["https://mainnet.base.org"],
          nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18
          },
          blockExplorerUrls: ["https://basescan.org"]
        }]
      });
    } else {
      throw err;
    }
  }
}

// =====================
// ⏳ MINT TIME CHECK
// =====================
function isMintLive() {
  const now = Date.now();

  if (now < MINT_TIME) {
    const diff = MINT_TIME - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    document.getElementById("status").innerText =
      `⏳ Mint starts in ${hours}h ${minutes}m`;

    document.getElementById("mintBtn").style.display = "none";
    return false;
  }

  return true;
}

// =====================
// 🔐 WALLET CONNECT
// =====================
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return;
  }

  try {
    // FORCE BASE NETWORK
    await switchToBase();

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = (await signer.getAddress()).toLowerCase();

    document.getElementById("status").innerText =
      "Connected on Base: " +
      userAddress.slice(0, 6) +
      "..." +
      userAddress.slice(-4);

    checkWhitelist();
  } catch (err) {
    document.getElementById("status").innerText =
      "❌ Please switch to Base network";
  }
}

// =====================
// 📄 WHITELIST CHECK
// =====================
async function checkWhitelist() {
  try {
    const res = await fetch("whitelist.json");
    const list = await res.json();

    const isWhitelisted = list
      .map(addr => addr.toLowerCase())
      .includes(userAddress);

    if (!isWhitelisted) {
      document.getElementById("status").innerText =
        "❌ You are not whitelisted";
      document.getElementById("mintBtn").style.display = "none";
      return;
    }

    if (!isMintLive()) return;

    document.getElementById("status").innerText =
      "✅ You are eligible to mint";
    document.getElementById("mintBtn").style.display = "inline-block";
  } catch (err) {
    document.getElementById("status").innerText =
      "❌ Whitelist check failed";
  }
}

// =====================
// 🪙 MINT FUNCTION
// =====================
async function mintNFT() {
  // Extra safety: ensure Base
  const chainId = await window.ethereum.request({
    method: "eth_chainId"
  });

  if (chainId !== BASE_CHAIN_ID) {
    alert("Please switch to Base network");
    return;
  }

  if (!isMintLive()) {
    alert("Mint not live yet");
    return;
  }

  try {
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ABI,
      signer
    );

    document.getElementById("status").innerText = "⏳ Minting...";

    const tx = await contract.whitelistMint();
    await tx.wait();

    document.getElementById("status").innerText =
      "🎉 Mint successful! Check OpenSea (Base)";
  } catch (err) {
    document.getElementById("status").innerText =
      "❌ Mint failed";
  }
}

// =====================
// 🔘 BUTTON HOOKS
// =====================
document.getElementById("connectBtn").onclick = connectWallet;
document.getElementById("mintBtn").onclick = mintNFT;

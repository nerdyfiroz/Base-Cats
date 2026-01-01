// ================= CONFIG =================

// 🕙 Mint time: 20 Jan 2026, 10:00 PM BD = 16:00 UTC
const MINT_TIME = new Date("2026-01-20T16:00:00Z").getTime();

// 🔵 Base Mainnet
const BASE_CHAIN_ID = "0x2105"; // 8453

// 🔗 Contract
const CONTRACT_ADDRESS = "0xFED68aE5123369Ed79EE210596368B3B5fEdDb63"; // <-- replace this
const CONTRACT_ABI = [
  "function mint() external"
];

// ================= GLOBAL =================
let provider;
let signer;
let userAddress = null;

// ================= COUNTDOWN =================
function updateCountdownUI() {
  const el = document.getElementById("countdown");
  if (!el) return;

  const now = Date.now();

  if (now < MINT_TIME) {
    const diff = MINT_TIME - now;
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    el.innerText = `⏳ Mint starts in ${d}d ${h}h ${m}m ${s}s`;
  } else {
    el.innerText = "🟢 Mint is LIVE";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateCountdownUI();
  setInterval(updateCountdownUI, 1000);
});

// ================= BASE NETWORK =================
async function switchToBase() {
  const chainId = await window.ethereum.request({
    method: "eth_chainId"
  });

  if (chainId === BASE_CHAIN_ID) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_ID }]
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: BASE_CHAIN_ID,
          chainName: "Base",
          rpcUrls: ["https://mainnet.base.org"],
          nativeCurrency: {
            name: "ETH",
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

// ================= WALLET CONNECT =================
async function connectWallet() {
  if (!window.ethereum) {
    alert("Wallet not detected");
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await switchToBase();

    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAddress = (await signer.getAddress()).toLowerCase();

    document.getElementById("status").innerText =
      "Connected: " +
      userAddress.slice(0, 6) +
      "..." +
      userAddress.slice(-4);

    updateCountdownUI();
    await checkWhitelist();
    updateMintButton();

  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText =
      "❌ Wallet connection failed";
  }
}

// ================= WHITELIST =================
async function checkWhitelist() {
  try {
    const res = await fetch("whitelist.json");
    const list = await res.json();

    if (!list.map(a => a.toLowerCase()).includes(userAddress)) {
      document.getElementById("status").innerText =
        "❌ Wallet not whitelisted";
      document.getElementById("mintBtn").style.display = "none";
      return;
    }
  } catch (e) {
    console.error("Whitelist error");
  }
}

// ================= MINT STATE =================
function isMintLive() {
  return Date.now() >= MINT_TIME;
}

function updateMintButton() {
  const mintBtn = document.getElementById("mintBtn");
  if (!mintBtn) return;

  if (isMintLive()) {
    mintBtn.style.display = "block";
  } else {
    mintBtn.style.display = "none";
  }
}

// ================= MINT =================
async function mintNFT() {
  if (!isMintLive()) {
    alert("Mint not live yet");
    return;
  }

  try {
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    document.getElementById("status").innerText = "Minting…";
    const tx = await contract.mint();
    await tx.wait();

    document.getElementById("status").innerText = "✅ Mint successful";
  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "❌ Mint failed";
  }
}

// ================= GLOBAL EXPORT =================
window.connectWallet = connectWallet;
window.mintNFT = mintNFT;

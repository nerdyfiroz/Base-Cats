/*********************************
 * CONFIG
 *********************************/
const BASE_CHAIN_ID = "0x2105"; // 8453
const MINT_TIME = new Date("2026-01-20T16:00:00Z").getTime(); // BD 10 PM
const statusEl = document.getElementById("status");
const mintBtn = document.getElementById("mintBtn");

/*********************************
 * COUNTDOWN
 *********************************/
function startCountdown() {
  const timer = setInterval(() => {
    const now = Date.now();
    const diff = MINT_TIME - now;

    if (diff <= 0) {
      clearInterval(timer);
      statusEl.innerText = "🟢 Mint is live";
      mintBtn.disabled = false;
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    statusEl.innerText = `⏳ Mint starts in ${d}d ${h}h ${m}m ${s}s`;
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
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: BASE_CHAIN_ID,
            chainName: "Base",
            rpcUrls: ["https://mainnet.base.org"],
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            blockExplorerUrls: ["https://basescan.org"],
          }],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/*********************************
 * WHITELIST CHECK
 *********************************/
async function checkWhitelist(address) {
  try {
    statusEl.innerText = "🔍 Checking whitelist...";

    const res = await fetch("/api/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    const data = await res.json();

    if (data.whitelisted) {
      statusEl.innerText = "✅ You are whitelisted";
      if (Date.now() >= MINT_TIME) mintBtn.disabled = false;
    } else {
      statusEl.innerText = "❌ You are not whitelisted";
      mintBtn.disabled = true;
    }
  } catch (err) {
    console.error(err);
    statusEl.innerText = "⚠️ Whitelist check failed";
  }
}

/*********************************
 * CONNECT WALLET
 *********************************/
async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask / Web3 wallet");
    return;
  }

  statusEl.innerText = "🔌 Connecting wallet...";

  const accounts = await ethereum.request({
    method: "eth_requestAccounts",
  });

  const address = accounts[0];

  statusEl.innerText = "🔄 Switching to Base network...";
  const switched = await switchToBase();

  if (!switched) {
    statusEl.innerText = "❌ Please switch to Base network";
    return;
  }

  // Desktop instantly works
  await checkWhitelist(address);
}

/*********************************
 * MOBILE FIX (CRITICAL)
 *********************************/
// Mobile wallets switch late → wait for chainChanged
if (window.ethereum) {
  ethereum.on("chainChanged", async () => {
    const accounts = await ethereum.request({
      method: "eth_accounts",
    });

    if (accounts.length > 0) {
      await checkWhitelist(accounts[0]);
    }
  });
}

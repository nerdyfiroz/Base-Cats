const CONTRACT_ADDRESS = "0xFED68aE5123369Ed79EE210596368B3B5fEdDb63";

const ABI = [
  "function whitelistMint() external"
];

let provider, signer, userAddress;

async function connectWallet() {
  if (!window.ethereum) {
    alert("Install MetaMask");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  userAddress = (await signer.getAddress()).toLowerCase();

  document.getElementById("status").innerText =
    "Connected: " + userAddress.slice(0,6) + "..." + userAddress.slice(-4);

  checkWhitelist();
}

async function checkWhitelist() {
  const res = await fetch("whitelist.json");
  const list = await res.json();

  if (list.map(a => a.toLowerCase()).includes(userAddress)) {
    document.getElementById("mintBtn").style.display = "block";
  } else {
    document.getElementById("status").innerText = "❌ Not whitelisted";
  }
}

async function mintNFT() {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const tx = await contract.whitelistMint();
    document.getElementById("status").innerText = "⏳ Minting...";
    await tx.wait();
    document.getElementById("status").innerText = "✅ Mint successful!";
  } catch {
    document.getElementById("status").innerText = "❌ Mint failed";
  }
}

document.getElementById("connectBtn").onclick = connectWallet;
document.getElementById("mintBtn").onclick = mintNFT;

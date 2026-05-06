// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BaseCatzNFT
 * @dev ERC-721 with packed trait storage, fusion burn, and ERC-2981 royalties.
 *      All traits packed into a single uint256 for gas efficiency.
 *
 * Bit layout (uint256 traits):
 *  [0-7]   combatPower  (uint8, 0-255)
 *  [8-15]  stealth      (uint8, 0-255)
 *  [16-23] hacking      (uint8, 0-255)
 *  [24-31] stamina      (uint8, 0-255)
 *  [32-34] rarity       (uint8, 0-4)
 *  [35-36] tier         (uint8, 0=Base,1=Evolved,2=Legendary)
 *  [37-42] abilitySlot1 (uint8)
 *  [43-48] abilitySlot2 (uint8)
 */
contract BaseCatzNFT is ERC721, ERC721Royalty, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    uint256 public constant MAX_SUPPLY    = 1111;
    uint256 public constant MINT_PRICE    = 0.05 ether;
    bool    public          mintActive    = false;
    string  private         _baseTokenURI;

    // Packed trait storage — 1 slot per token
    mapping(uint256 => uint256) private _packedTraits;
    // Whitelist
    mapping(address => bool) public whitelist;
    // Referrals
    mapping(address => address) public referredBy;
    mapping(address => uint256) public referralCount;

    address public fusionContract;

    event Minted(address indexed to, uint256 indexed tokenId, uint256 traits);
    event Fused(address indexed owner, uint256 burnedA, uint256 burnedB, uint256 newTokenId);
    event Referred(address indexed referrer, address indexed referee);

    modifier onlyFusionContract() {
        require(msg.sender == fusionContract, "Not fusion contract");
        _;
    }

    constructor(address royaltyRecipient) ERC721("Base Catz", "BCATZ") Ownable(msg.sender) {
        _setDefaultRoyalty(royaltyRecipient, 500); // 5% royalty
    }

    // ─── Minting ──────────────────────────────────────────
    function mint(address referrer) external payable {
        require(mintActive, "Mint not active");
        require(msg.value >= MINT_PRICE, "Insufficient ETH");
        require(_tokenIdCounter.current() < MAX_SUPPLY, "Sold out");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);

        // Pseudo-random traits (use Chainlink VRF in production)
        uint256 traits = _generateTraits(tokenId, msg.sender);
        _packedTraits[tokenId] = traits;

        // Referral tracking
        if (referrer != address(0) && referrer != msg.sender && referredBy[msg.sender] == address(0)) {
            referredBy[msg.sender] = referrer;
            referralCount[referrer]++;
            emit Referred(referrer, msg.sender);
        }

        emit Minted(msg.sender, tokenId, traits);
    }

    function whitelistMint() external {
        require(whitelist[msg.sender], "Not whitelisted");
        require(_tokenIdCounter.current() < MAX_SUPPLY, "Sold out");
        whitelist[msg.sender] = false;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _packedTraits[tokenId] = _generateTraits(tokenId, msg.sender);
        emit Minted(msg.sender, tokenId, _packedTraits[tokenId]);
    }

    // ─── Fusion ───────────────────────────────────────────
    /**
     * @dev Burns two Level 50 cats and mints one Evolved cat.
     *      Called by the FusionContract (holds the 500 CRED payment check).
     */
    function fuse(address owner, uint256 catA, uint256 catB)
        external onlyFusionContract returns (uint256 newId)
    {
        require(ownerOf(catA) == owner && ownerOf(catB) == owner, "Not owner");

        uint256 traitsA = _packedTraits[catA];
        uint256 traitsB = _packedTraits[catB];

        _burn(catA);
        _burn(catB);
        delete _packedTraits[catA];
        delete _packedTraits[catB];

        newId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(owner, newId);

        // Evolved traits: best of each stat + tier bump
        uint256 evolved = _mergeTraits(traitsA, traitsB);
        _packedTraits[newId] = evolved;

        emit Fused(owner, catA, catB, newId);
        return newId;
    }

    // ─── Trait Reading ────────────────────────────────────
    function getTraits(uint256 tokenId) external view returns (
        uint8 combatPower, uint8 stealth, uint8 hacking,
        uint8 stamina, uint8 rarity, uint8 tier
    ) {
        uint256 packed = _packedTraits[tokenId];
        combatPower = uint8(packed);
        stealth     = uint8(packed >> 8);
        hacking     = uint8(packed >> 16);
        stamina     = uint8(packed >> 24);
        rarity      = uint8((packed >> 32) & 0x7);
        tier        = uint8((packed >> 35) & 0x3);
    }

    // ─── Owner Admin ──────────────────────────────────────
    function setMintActive(bool active) external onlyOwner { mintActive = active; }
    function setBaseURI(string calldata uri) external onlyOwner { _baseTokenURI = uri; }
    function setFusionContract(address fc) external onlyOwner { fusionContract = fc; }
    function addWhitelist(address[] calldata addrs) external onlyOwner {
        for (uint i = 0; i < addrs.length; i++) whitelist[addrs[i]] = true;
    }
    function withdraw() external onlyOwner {
        (bool ok,) = owner().call{value: address(this).balance}("");
        require(ok, "Transfer failed");
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // ─── Internal ─────────────────────────────────────────
    function _generateTraits(uint256 tokenId, address minter) internal view returns (uint256) {
        uint256 seed = uint256(keccak256(abi.encodePacked(block.prevrandao, tokenId, minter, block.timestamp)));
        uint8 cp  = uint8(50 + (seed & 0xFF) % 150);        // 50-200
        uint8 st  = uint8(30 + ((seed >> 8) & 0xFF) % 170);
        uint8 hk  = uint8(30 + ((seed >> 16) & 0xFF) % 170);
        uint8 sp  = uint8(60 + ((seed >> 24) & 0xFF) % 40);  // 60-100
        // Rarity: 0=60%, 1=25%, 2=10%, 3=4%, 4=1%
        uint8 roll = uint8((seed >> 32) & 0xFF);
        uint8 rar  = roll < 153 ? 0 : roll < 217 ? 1 : roll < 242 ? 2 : roll < 252 ? 3 : 4;
        uint8 ab1  = uint8((seed >> 40) & 0x3F) % 6;
        uint8 ab2  = uint8((seed >> 46) & 0x3F) % 6;

        return uint256(cp) | (uint256(st) << 8) | (uint256(hk) << 16) |
               (uint256(sp) << 24) | (uint256(rar) << 32) | (uint256(ab1) << 37) | (uint256(ab2) << 43);
    }

    function _mergeTraits(uint256 a, uint256 b) internal pure returns (uint256) {
        // Best of each stat, +10 bonus, rarity = max+1 capped at 4, tier = 1 (Evolved)
        uint8 cp  = uint8(min(255, max(uint8(a), uint8(b)) + 10));
        uint8 st  = uint8(min(255, max(uint8(a >> 8), uint8(b >> 8)) + 10));
        uint8 hk  = uint8(min(255, max(uint8(a >> 16), uint8(b >> 16)) + 10));
        uint8 sp  = uint8(min(100, max(uint8(a >> 24), uint8(b >> 24)) + 5));
        uint8 rar = uint8(min(4, max(uint8((a >> 32) & 0x7), uint8((b >> 32) & 0x7)) + 1));
        uint8 tier = 1; // Evolved

        return uint256(cp) | (uint256(st) << 8) | (uint256(hk) << 16) |
               (uint256(sp) << 24) | (uint256(rar) << 32) | (uint256(tier) << 35);
    }

    function max(uint8 a, uint8 b) internal pure returns (uint8) { return a >= b ? a : b; }
    function min(uint8 a, uint8 b) internal pure returns (uint8) { return a <= b ? a : b; }

    function _baseURI() internal view override returns (string memory) { return _baseTokenURI; }

    // ERC165 override
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721Royalty) returns (bool)
    { return super.supportsInterface(interfaceId); }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./BaseCatzNFT.sol";

contract GangRegistry is Ownable {
    struct Gang {
        bytes32 nameHash;
        address leader;
        uint256 memberCount;
        uint256 pvpWins;
        bool    exists;
    }

    struct Territory {
        uint256 gangId;
        uint256 hp;
        uint256 lastUpdated;
    }

    BaseCatzNFT public nftContract;
    uint256 public gangCount;
    uint256 public constant MAX_GANG_MEMBERS = 30;
    uint256 public constant TERRITORY_COUNT  = 6;
    uint256 public constant TERRITORY_MAX_HP = 1000;

    mapping(uint256 => Gang)      public gangs;
    mapping(address => uint256)   public playerGang;
    mapping(uint256 => address[]) public gangMembers;
    mapping(uint256 => Territory) public territories;

    event GangCreated(uint256 indexed gangId, address indexed leader);
    event TerritoryCapture(uint256 indexed districtId, uint256 indexed newController);

    constructor(address _nft) Ownable(msg.sender) {
        nftContract = BaseCatzNFT(_nft);
        for (uint256 i = 0; i < TERRITORY_COUNT; i++) {
            territories[i] = Territory({ gangId: 0, hp: TERRITORY_MAX_HP, lastUpdated: block.timestamp });
        }
    }

    function createGang(string calldata name) external returns (uint256 gangId) {
        require(playerGang[msg.sender] == 0, "Already in a gang");
        gangCount++;
        gangId = gangCount;
        gangs[gangId] = Gang({ nameHash: keccak256(abi.encodePacked(name)), leader: msg.sender, memberCount: 1, pvpWins: 0, exists: true });
        playerGang[msg.sender] = gangId;
        gangMembers[gangId].push(msg.sender);
        emit GangCreated(gangId, msg.sender);
    }

    function joinGang(uint256 gangId) external {
        require(gangs[gangId].exists && playerGang[msg.sender] == 0 && gangs[gangId].memberCount < MAX_GANG_MEMBERS);
        playerGang[msg.sender] = gangId;
        gangMembers[gangId].push(msg.sender);
        gangs[gangId].memberCount++;
    }

    function applyRaidDamage(uint256 districtId, uint256 raidingGangId, uint256 damage) external onlyOwner {
        Territory storage t = territories[districtId];
        if (t.gangId == 0) { t.gangId = raidingGangId; t.hp = TERRITORY_MAX_HP; return; }
        if (t.gangId == raidingGangId) return;
        t.hp = t.hp > damage ? t.hp - damage : 0;
        t.lastUpdated = block.timestamp;
        if (t.hp == 0) { t.gangId = raidingGangId; t.hp = TERRITORY_MAX_HP; emit TerritoryCapture(districtId, raidingGangId); }
    }

    function getGangMembers(uint256 gangId) external view returns (address[] memory) { return gangMembers[gangId]; }
}

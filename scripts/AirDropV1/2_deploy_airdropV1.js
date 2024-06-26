const { ethers } = require("hardhat");
Web3 = require("web3");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");
const fs = require("fs");

async function main() {
  const qrc20Address = "0x47530692352c05A331Fb67B14Ece4cAcB280a771";
  const QRC20 = await ethers.getContractFactory("QRC20");
  const contract = QRC20.attach(qrc20Address);

  // Merkle Root
  let addresses = [
    {
      addr: "0x55f2c051d8136E44942205f0b0045c1824eEa6B0",
    },
    {
      addr: "0xF446609Bb1576E587969Eb2a88c0F7288C732856",
    },
  ];

  const leafNodes = addresses.map((address) =>
    keccak256(Buffer.from(address.addr.replace("0x", ""), "hex"))
  );

  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

  root = merkleTree.getHexRoot();

  const data = {
    addresses: addresses.map((address) => address.addr),
    leafNodes: leafNodes,
    root: root,
  };

  fs.writeFileSync("tree.json", JSON.stringify(data, null, 2));

  console.log("Deploying Airdrop V1...");

  const AirDropV1 = await ethers.getContractFactory("AirDropV1");

  const dropAmt = Web3.utils.toWei("20", "ether");
  const airdrop = await AirDropV1.deploy();

  await airdrop.waitForDeployment();

  console.log("AirdropV1 deployed to:", await airdrop.getAddress());
  await airdrop.create_airdrop(qrc20Address, dropAmt, root);

  console.log("Funding the Airdrop");

  //mint token
  const airdropAddress = airdrop.getAddress();
  const mintAmount = Web3.utils.toWei("2000", "ether");
  await contract.mintTo(airdropAddress, mintAmount);
  console.log("Airdrop Funded...");
}

main();

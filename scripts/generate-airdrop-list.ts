import { ethers, providers } from "ethers";
import { writeFileSync } from "fs";

const outputFilePath = "scripts/airdrop-accounts.json";
const provider = new providers.WebSocketProvider("wss://andromeda-ws.metis.io");
const tokenAddr = "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000";
const snapshotStartBlock = 0;
const snapshotEndBlock = 640219;

const Erc20Abi = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },]

type BlockRange = {
  start: number;
  end: number;
}

async function main() {
  console.info("Fetching Data...\n");
  const Erc20I = new ethers.Contract(tokenAddr, Erc20Abi, provider);
  const filter = Erc20I.filters.Transfer();

  const blockInterval = 50_000;
  const blockRanges: BlockRange[] = [{ start: snapshotStartBlock, end: snapshotStartBlock + blockInterval }];
  while (blockRanges[blockRanges.length - 1].end < snapshotEndBlock) {
    const nextRange: BlockRange = {
      start: blockRanges[blockRanges.length - 1].end + 1,
      end: Math.min(blockRanges[blockRanges.length - 1].end + blockInterval, snapshotEndBlock),
    }
    blockRanges.push(nextRange)
  }
  const allAccounts: string[] = [];
  const transferPromises = blockRanges.map(blockRange => Erc20I.queryFilter(filter, blockRange.start, blockRange.end));
  const transferResults = await Promise.all(transferPromises);

  for (const result of transferResults) {
    result.forEach(log => {
      allAccounts.push(log.args?.from);
      allAccounts.push(log.args?.to);
    });
  }
  const uniqueAccounts = [...new Set(allAccounts)];
  console.info(`${uniqueAccounts.length.toLocaleString()} unique accounts found from ${allAccounts.length.toLocaleString()} accounts`);
  writeFileSync(outputFilePath, JSON.stringify(uniqueAccounts, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

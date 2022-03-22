import { program } from 'commander'
import fs from 'fs'
import { parseBalanceMap } from '../src/parse-balance-map'

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing a map of account addresses to string balances'
  )

program.parse(process.argv)

const AIRDROP_AMOUNT = 100000000000;   // 1000 cTokens
const outputPath = 'scripts/result.json';

const jsonAccounts = JSON.parse(fs.readFileSync(program.input, { encoding: 'utf8' }))

if (typeof jsonAccounts !== 'object') throw new Error('Invalid JSON')

type BalanceMapFormat = { [account: string]: number | string }
const balanceMap: BalanceMapFormat = {};

for (const account of jsonAccounts) {
  balanceMap[account] = AIRDROP_AMOUNT;
}

const data = JSON.stringify(parseBalanceMap(balanceMap), null, 2);
fs.writeFileSync(outputPath, data);

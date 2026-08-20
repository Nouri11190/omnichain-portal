import { useState } from 'react'
import { BrowserProvider, Contract, formatUnits } from 'ethers'
import './App.css'

const NETWORKS = {
  sepolia: { name: 'Ethereum Sepolia', chainId: 11155111 },
  bscTestnet: { name: 'BSC Testnet', chainId: 97 },
}

function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [contractAddress, setContractAddress] = useState('')
  const [abiText, setAbiText] = useState('')
  const [functionName, setFunctionName] = useState('')
  const [args, setArgs] = useState('')
  const [result, setResult] = useState('')
  const [network, setNetwork] = useState<keyof typeof NETWORKS>('sepolia')

  async function connectWallet() {
    if (!(window as any).ethereum) {
      setResult('No wallet found. Install MetaMask or similar.')
      return
    }
    const provider = new BrowserProvider((window as any).ethereum)
    const accounts = await provider.send('eth_requestAccounts', [])
    setAccount(accounts[0])
  }

  async function callFunction(isWrite: boolean) {
    try {
      if (!(window as any).ethereum) throw new Error('No wallet found')
      if (!contractAddress || !abiText) throw new Error('Address and ABI required')

      const provider = new BrowserProvider((window as any).ethereum)
      const signer = isWrite ? await provider.getSigner() : provider
      const abi = JSON.parse(abiText)
      const contract = new Contract(contractAddress, abi, signer)

      const parsedArgs = args
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0)

      const fn = contract[functionName]
      if (!fn) throw new Error(`Function "${functionName}" not found in ABI`)

      if (isWrite) {
        const tx = await fn(...parsedArgs)
        setResult(`Tx sent: ${tx.hash}\nWaiting for confirmation...`)
        await tx.wait()
        setResult(`Confirmed: ${tx.hash}`)
      } else {
        const res = await fn(...parsedArgs)
        setResult(typeof res === 'bigint' ? formatUnits(res, 0) : String(res))
      }
    } catch (err: any) {
      setResult(`Error: ${err.message || String(err)}`)
    }
  }

  return (
    <div className="portal">
      <h1>Solidity Contract Dev Portal</h1>

      <section>
        <label>Network</label>
        <select value={network} onChange={(e) => setNetwork(e.target.value as keyof typeof NETWORKS)}>
          {Object.entries(NETWORKS).map(([key, val]) => (
            <option key={key} value={key}>{val.name}</option>
          ))}
        </select>
      </section>

      <section>
        {account ? (
          <p>Connected: {account}</p>
        ) : (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
      </section>

      <section>
        <label>Contract Address</label>
        <input
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="0x..."
        />
      </section>

      <section>
        <label>ABI (JSON)</label>
        <textarea
          value={abiText}
          onChange={(e) => setAbiText(e.target.value)}
          placeholder='[{"inputs":[],"name":"...","outputs":[...],"stateMutability":"view","type":"function"}]'
          rows={6}
        />
      </section>

      <section>
        <label>Function Name</label>
        <input
          value={functionName}
          onChange={(e) => setFunctionName(e.target.value)}
          placeholder="balanceOf"
        />
        <label>Args (comma-separated)</label>
        <input
          value={args}
          onChange={(e) => setArgs(e.target.value)}
          placeholder="0xabc..., 1000"
        />
        <div className="button-row">
          <button onClick={() => callFunction(false)}>Read</button>
          <button onClick={() => callFunction(true)}>Write</button>
        </div>
      </section>

      <section>
        <label>Result</label>
        <pre className="result">{result}</pre>
      </section>
    </div>
  )
}

export default App

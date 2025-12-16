// -----------------------------------------------------------
// FRONTEND - app.js (FINAL VERSION with Dark Mode, Full Features)
// Contract Address: 0x9a1e3074c94B769e0321c5750334FC25668bB62d
// -----------------------------------------------------------

const contractAddress = "0x9a1e3074c94B769e0321c5750334FC25668bB62d"; 

// FULL, CORRECT ABI for the contract with s_lastWinner, s_history, and isEntered
const abi = [ 
	{
		"inputs": [],
		"name": "enterLottery",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "pickWinner",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "LotteryEntered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "winner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "prizeAmount",
				"type": "uint256"
			}
		],
		"name": "WinnerPicked",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "getPlayers",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_player",
				"type": "address"
			}
		],
		"name": "isEntered",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "manager",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "players",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "s_entries",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "s_history",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "s_lastWinner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]; 


// Ethers Variables
let provider;
let signer;
let contract;
let currentAccount = null;
let contractManager = null;
let isUserEntered = false; // New state variable

// DOM Elements
const connectBtn = document.getElementById("connectBtn");
const enterBtn = document.getElementById("enterBtn");
const pickBtn = document.getElementById("pickBtn");
const statusBar = document.getElementById("status-bar");
const statusMessage = document.getElementById("status-message");
const managerSection = document.getElementById("manager-section");
const profileSection = document.getElementById("profile-section"); 
const contractBalanceEl = document.getElementById("contract-balance");
const playersCountEl = document.getElementById("players-count");
const accountAddressEl = document.getElementById("account-address");
const managerAddressEl = document.getElementById("manager-address");
const lastWinnerEl = document.getElementById("last-winner");
const entryStatusEl = document.getElementById("entry-status"); 
const totalWinningsEl = document.getElementById("total-winnings"); 

// Utility Functions
const showStatus = (msg, type = 'default') => {
    statusMessage.innerText = msg;
    statusBar.className = `status-bar ${type}`;
};

const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const setLoading = (btnId, isLoading) => {
    const btn = document.getElementById(btnId);
    const textEl = document.getElementById(`${btnId.replace('Btn', '')}-text`);
    const spinnerEl = btn.querySelector('.loading-spinner');

    btn.disabled = isLoading;
    textEl.classList.toggle('hidden', isLoading);
    spinnerEl.classList.toggle('hidden', !isLoading);
    
    if (btnId === 'enterBtn') {
        if (!isLoading && currentAccount && !isUserEntered) {
             btn.disabled = false;
        } else if (isUserEntered) {
             btn.disabled = true;
        }
    }
};

// State Functions
const fetchContractState = async () => {
    try {
        const _manager = await contract.manager();
        if (!contractManager) {
            contractManager = _manager;
            managerAddressEl.innerText = formatAddress(contractManager);
        }

        // 1. Get Players and Balance
        const players = await contract.getPlayers();
        playersCountEl.innerText = players.length;

        const balanceWei = await provider.getBalance(contractAddress);
        const balanceEth = ethers.utils.formatEther(balanceWei);
        contractBalanceEl.innerText = `${parseFloat(balanceEth).toFixed(4)} ETH`;
        
        // 2. Get Last Winner
        const lastWinner = await contract.s_lastWinner();
        lastWinnerEl.innerText = lastWinner === '0x0000000000000000000000000000000000000000' 
                                 ? 'Awaiting first draw...' 
                                 : formatAddress(lastWinner);

        // 3. Update User-Specific State (Profile)
        if (currentAccount) {
            // isEntered call is now working thanks to the ABI fix!
            isUserEntered = await contract.isEntered(currentAccount); 
            entryStatusEl.innerText = isUserEntered ? '✅ Entered' : '❌ Not Entered';
            
            // Re-check entry button state
            enterBtn.disabled = isUserEntered; 

            // s_history call is now working!
            const winningsWei = await contract.s_history(currentAccount); 
            const winningsEth = ethers.utils.formatEther(winningsWei);
            totalWinningsEl.innerText = `${parseFloat(winningsEth).toFixed(4)} ETH`;
        }

    } catch (error) {
        console.error("Error fetching state:", error);
        if (error.code === 'CALL_EXCEPTION' || error.reason) {
             showStatus("Contract call failed. Check console for ABI/Network errors.", 'error');
        } else if (!contractManager) {
             showStatus("Could not fetch DApp state. Check contract deployment/network.", 'error');
        }
    }
};

const updateUIForConnection = () => {
    // Connect contract with signer if account is present, otherwise use provider (read-only)
    const activeContract = currentAccount ? contract.connect(signer) : contract.connect(provider);
    contract = activeContract;

    if (currentAccount) {
        document.getElementById("connect-status").innerText = "Wallet Connected!";
        accountAddressEl.innerText = formatAddress(currentAccount);
        connectBtn.classList.add('hidden');
        enterBtn.disabled = isUserEntered;
        profileSection.classList.remove('hidden');
    } else {
        document.getElementById("connect-status").innerText = "Wallet Not Connected";
        accountAddressEl.innerText = '';
        connectBtn.classList.remove('hidden');
        enterBtn.disabled = true;
        profileSection.classList.add('hidden');
    }
    
    // Manager Detection
    const isManager = currentAccount && contractManager && currentAccount.toLowerCase() === contractManager.toLowerCase();
    managerSection.classList.toggle('hidden', !isManager);
};

// --- CORE FUNCTIONS ---

const initDapp = async () => {
    if (typeof window.ethereum === 'undefined') {
        showStatus("Please install MetaMask to use this DApp.", 'error');
        return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    contract = new ethers.Contract(contractAddress, abi, provider); 

    try {
        // Check for pre-connected accounts
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            signer = provider.getSigner();
        }
    } catch (e) {
        console.error("Error listing accounts:", e);
    }
    
    // Initial state fetch (This will now pull all data including profile info!)
    await fetchContractState();
    updateUIForConnection();
    showStatus("DApp loaded. Connect your wallet to enter.", 'default');

    // Listen for events (Real-time updates!)
    contract.on("LotteryEntered", async (player, amount) => {
        await fetchContractState();
        showStatus(`Player ${formatAddress(player)} entered the lottery! Pool increased.`, 'success');
    });

    contract.on("WinnerPicked", async (winner, prizeAmount) => {
        await fetchContractState();
        showStatus(`🥳 WINNER PICKED! ${formatAddress(winner)} won ${ethers.utils.formatEther(prizeAmount)} ETH!`, 'success');
    });
};


// --- EVENT HANDLERS ---

connectBtn.onclick = async () => {
    try {
        setLoading('connectBtn', true);
        showStatus("Connecting wallet...", 'loading');
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        currentAccount = accounts[0];
        signer = provider.getSigner();
        updateUIForConnection();
        await fetchContractState(); 
        showStatus("Wallet Connected! Welcome.", 'success');
        setLoading('connectBtn', false);
    } catch (err) {
        setLoading('connectBtn', false);
        showStatus("Connection failed. Check MetaMask.", 'error');
        console.error(err);
    }
};

enterBtn.onclick = async () => {
    if (!currentAccount) {
        showStatus("Please connect your wallet first.", 'error');
        return;
    }
    if (isUserEntered) {
        showStatus("You have already entered this round!", 'error');
        return;
    }
    setLoading('enterBtn', true);
    showStatus("Sending transaction to enter lottery...", 'loading');
    
    try {
        const tx = await contract.enterLottery({
            value: ethers.utils.parseEther("0.01")
        });
        showStatus("Transaction sent. Waiting for confirmation...", 'loading');
        await tx.wait();
        setLoading('enterBtn', false);
    } catch (err) {
        setLoading('enterBtn', false);
        let msg = err.reason || err.message || "Transaction failed.";
        showStatus(`Error entering lottery: ${msg}`, 'error');
        console.error(err);
    }
};

pickBtn.onclick = async () => {
    if (!currentAccount) return;
    setLoading('pickBtn', true);
    showStatus("Sending transaction to pick winner...", 'loading');

    try {
        const tx = await contract.pickWinner();
        showStatus("Transaction sent. Waiting for confirmation...", 'loading');
        await tx.wait();
        setLoading('pickBtn', false);
    } catch (err) {
        setLoading('pickBtn', false);
        let msg = err.reason || err.message || "Transaction failed. Only manager can call this.";
        showStatus(`Error picking winner: ${msg}`, 'error');
        console.error(err);
    }
};

// Listen for account changes
window.ethereum.on('accountsChanged', (accounts) => {
    currentAccount = accounts.length > 0 ? accounts[0] : null;
    signer = currentAccount ? provider.getSigner() : null;
    updateUIForConnection();
    if (currentAccount) {
        showStatus(`Switched account to ${formatAddress(currentAccount)}`, 'default');
        fetchContractState(); 
    } else {
        showStatus("Wallet disconnected.", 'default');
    }
});

// Start the DApp!
initDapp();
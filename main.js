let WALLET_CONNECTED = "";
let contractAddress = "0xeB51d9b9B644014aF89559e3B2141C924954333e"; 
let etiTokenAddress = "0x3dd3211c822E741200A2C760589814810CAeeCbA"; 

let contractAbi = [
    {
      "inputs": [
        {
          "internalType": "string[]",
          "name": "_candidateNames",
          "type": "string[]"
        },
        {
          "internalType": "uint256",
          "name": "_durationInMinutes",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "CandidateAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "voter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "candidateIndex",
          "type": "uint256"
        }
      ],
      "name": "VoteCast",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "newRoot",
          "type": "bytes32"
        }
      ],
      "name": "VotersRootUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "startTime",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "endTime",
          "type": "uint256"
        }
      ],
      "name": "VotingWindowSet",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        }
      ],
      "name": "addCandidate",
      "outputs": [],
      "stateMutability": "nonpayable",
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
      "name": "candidates",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "voteCount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllVotesOfCandidates",
      "outputs": [
        {
          "internalType": "string[]",
          "name": "names",
          "type": "string[]"
        },
        {
          "internalType": "uint256[]",
          "name": "votes",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_index",
          "type": "uint256"
        }
      ],
      "name": "getCandidate",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "voteCount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCandidatesCount",
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
      "name": "getRemainingTime",
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
      "name": "getTimeUntilStart",
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
      "name": "getVotingStatus",
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
          "name": "_voter",
          "type": "address"
        }
      ],
      "name": "hasVoted",
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
      "name": "owner",
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
          "internalType": "bytes32",
          "name": "_root",
          "type": "bytes32"
        }
      ],
      "name": "setVotersRoot",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_startTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_endTime",
          "type": "uint256"
        }
      ],
      "name": "setVotingWindow",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_voter",
          "type": "address"
        },
        {
          "internalType": "bytes32[]",
          "name": "_proof",
          "type": "bytes32[]"
        }
      ],
      "name": "verifyVoter",
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
          "internalType": "uint256",
          "name": "_candidateIndex",
          "type": "uint256"
        },
        {
          "internalType": "bytes32[]",
          "name": "_proof",
          "type": "bytes32[]"
        }
      ],
      "name": "vote",
      "outputs": [],
      "stateMutability": "nonpayable",
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
      "name": "voters",
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
      "name": "votersRoot",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "votingEnd",
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
      "name": "votingStart",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

let etiTokenAbi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "mint",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

async function connectMetamask() {
    if (typeof window.ethereum === 'undefined') {
        alert("MetaMask not detected! Please install MetaMask.");
        return;
    }
    
    try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        WALLET_CONNECTED = accounts[0];
        const notificationEl = document.getElementById("metamasknotification");
        if (notificationEl) {
            notificationEl.innerText = "✅ MetaMask connected: " + WALLET_CONNECTED.substring(0, 6) + "..." + WALLET_CONNECTED.substring(38);
        }
        console.log("Connected wallet:", WALLET_CONNECTED);
        
        if (etiTokenAddress && etiTokenAddress !== "YOUR_ETI_TOKEN_ADDRESS") {
            checkETIBalance();
        }
    } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        const notificationEl = document.getElementById("metamasknotification");
        if (notificationEl) {
            notificationEl.innerText = " Error connecting to MetaMask";
        }
    }
}

function getContractReadOnly() {
    if (typeof window.ethereum === 'undefined') {
        throw new Error("MetaMask not installed");
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    return new ethers.Contract(contractAddress, contractAbi, provider);
}

function getContractWithSigner() {
    if (typeof window.ethereum === 'undefined') {
        throw new Error("MetaMask not installed");
    }
    if (!WALLET_CONNECTED) {
        throw new Error("Please connect MetaMask first");
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, contractAbi, signer);
}

async function checkETIBalance() {
    if (!WALLET_CONNECTED) {
        console.log('Wallet not connected');
        return;
    }

    if (!etiTokenAddress || etiTokenAddress === "YOUR_ETI_TOKEN_ADDRESS") {
        console.log('ETI Token address not set');
        return;
    }

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const etiContract = new ethers.Contract(etiTokenAddress, etiTokenAbi, provider);
        
        const balance = await etiContract.balanceOf(WALLET_CONNECTED);
        const balanceFormatted = ethers.utils.formatEther(balance);
        
        console.log('💰 ETI Balance:', balanceFormatted, 'ETI');
        
        const balanceEl = document.getElementById("etiBalance");
        if (balanceEl) {
            balanceEl.textContent = `${parseFloat(balanceFormatted).toFixed(2)} ETI`;
        }
        
        return balanceFormatted;
    } catch (error) {
        console.error('Error checking ETI balance:', error);
    }
}

async function addVote() {
    const indexInput = document.getElementById("vote");
    const p3 = document.getElementById("p3");
    
    if (!indexInput || indexInput.value === "") {
        if (p3) p3.innerText = "⚠️ Please enter candidate index";
        return;
    }

    const index = parseInt(indexInput.value);

    try {
        if (p3) p3.innerText = "⏳ Sending vote...";
        
        const contract = getContractWithSigner();
        const tx = await contract.vote(index);
        
        if (p3) p3.innerText = " Waiting for confirmation...";
        await tx.wait();
        
        if (p3) p3.innerText = " Vote added successfully!  You will receive 10 ETI tokens after voting ends!";
        indexInput.value = "";
        
        setTimeout(() => getAllCandidates(), 1000);
    } catch (error) {
        console.error("Error voting:", error);
        if (p3) {
            if (error.message.includes("connect")) {
                p3.innerText = " Please connect MetaMask first";
            } else if (error.message.includes("user rejected")) {
                p3.innerText = " Transaction rejected";
            } else if (error.message.includes("already voted")) {
                p3.innerText = " You have already voted!";
            } else {
                p3.innerText = " Error: " + error.message;
            }
        }
    }
}

async function voteStatus() {
    const statusEl = document.getElementById("status");
    const timeEl = document.getElementById("time");
    
    try {
        const contract = getContractReadOnly();
        const status = await contract.getVotingStatus();
        
        let timeInfo = "";
        try {
            const remainingTime = await contract.getRemainingTime();
            const seconds = Number(remainingTime);
            if (seconds > 0) {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                timeInfo = `Time remaining: ${hours}h ${minutes}m`;
            } else {
                timeInfo = "Voting has ended";
            }
        } catch {
            try {
                const endTime = await contract.votingEnd();
                const date = new Date(Number(endTime) * 1000);
                timeInfo = "Voting ends at: " + date.toLocaleString('he-IL');
            } catch (e) {
                console.log("Could not get time info:", e);
            }
        }
        
        if (statusEl) {
            statusEl.innerText = status ? "🟢 Voting is currently open" : "🔴 Voting has ended";
            if (!status) {
                statusEl.innerText += " - ETI rewards distribution pending";
            }
        }
        if (timeEl && timeInfo) {
            timeEl.innerText = timeInfo;
        }
    } catch (error) {
        console.error("Error checking status:", error);
        if (statusEl) {
            statusEl.innerText = " Error loading status";
        }
    }
}

async function getAllCandidates() {
    const tbody = document.querySelector("#myTable tbody");
    const p3 = document.getElementById("p3");
    
    if (!tbody) {
        console.error("Table body not found");
        return;
    }
    
    try {
        tbody.innerHTML = '<tr><td colspan="3" style="padding: 30px; text-align: center;">⏳ Loading candidates...</td></tr>';
        
        const contract = getContractReadOnly();
        
        const [names, votes] = await contract.getAllVotesOfCandidates();

        console.log("Candidates:", names);
        console.log("Votes:", votes);

        tbody.innerHTML = "";

        if (names.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="padding: 30px; text-align: center; color: #999;">No candidates yet</td></tr>';
            if (p3) p3.innerText = "No candidates found";
            return;
        }

        for (let i = 0; i < names.length; i++) {
            const row = tbody.insertRow();
            const idCell = row.insertCell();
            const nameCell = row.insertCell();
            const voteCell = row.insertCell();
            
            idCell.innerHTML = i;
            nameCell.innerHTML = names[i];
            voteCell.innerHTML = votes[i].toString();
        }
        
        if (p3) {
            p3.innerText = ` Loaded ${names.length} candidates`;
        }
    } catch (error) {
        console.error("Error loading candidates:", error);
        tbody.innerHTML = '<tr><td colspan="3" style="padding: 30px; text-align: center; color: #dc3545;">❌ Error loading candidates. Please check network and contract address.</td></tr>';
        
        if (p3) {
            if (error.message.includes("network")) {
                p3.innerText = " Error: Please connect to the correct network";
            } else if (error.message.includes("MetaMask")) {
                p3.innerText = " Please install MetaMask";
            } else if (error.message.includes("revert")) {
                p3.innerText = " Contract error: Function not available or wrong network";
            } else {
                p3.innerText = " Error: " + error.message;
            }
        }
    }
}

window.addEventListener('load', () => {
    console.log("Page loaded, waiting for ethers.js...");
    
    setTimeout(() => {
        if (typeof ethers !== 'undefined') {
            console.log("Ethers.js loaded, loading candidates...");
            getAllCandidates();
        } else {
            console.error("Ethers.js not loaded");
        }
    }, 500);
});
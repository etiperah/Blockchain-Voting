require('dotenv').config();
const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
const path = require("path");
const ethers = require('ethers');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

app.use(fileUpload({ extended: true }));
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 3000;

const API_URL = process.env.API_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const { abi } = require('./artifacts/contracts/Voting.sol/Voting.json');

const provider = new ethers.providers.JsonRpcProvider(API_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

let votersList = [];
let merkleTree = null;

function createMerkleTree(addresses) {
    const leaves = addresses.map(addr => keccak256(addr));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    return tree;
}

function getMerkleProof(address) {
    if (!merkleTree) return [];
    const leaf = keccak256(address);
    const proof = merkleTree.getHexProof(leaf);
    return proof;
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "VotingAdmin.html"));
});

app.get("/voters", (req, res) => {
    res.sendFile(path.join(__dirname, "ListVoters.html"));
});

app.get("/questionnaire", (req, res) => {
    res.sendFile(path.join(__dirname, "Questionnaire.html"));
});

app.get("/api/questions", async (req, res) => {
    try {
        const questions = await contractInstance.getQuestions();
        res.json({
            success: true,
            questions: questions
        });
    } catch (error) {
        console.error("Error getting questions:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/set-questions", async (req, res) => {
    try {
        const { questions } = req.body;
        
        if (!Array.isArray(questions) || questions.length !== 3) {
            return res.status(400).json({ error: "Must provide exactly 3 questions" });
        }

        const tx = await contractInstance.setQuestions(questions);
        await tx.wait();

        res.json({
            success: true,
            message: "Questions updated successfully"
        });
    } catch (error) {
        console.error("Error setting questions:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/submit-candidate-questionnaire", async (req, res) => {
    try {
        const { candidateIndex, answers } = req.body;
        
        if (!Array.isArray(answers) || answers.length !== 3) {
            return res.status(400).json({ error: "Must provide exactly 3 answers" });
        }

        const validAnswers = answers.every(a => a === -1 || a === 0 || a === 1);
        if (!validAnswers) {
            return res.status(400).json({ error: "Answers must be -1, 0, or 1" });
        }

        const tx = await contractInstance.submitCandidateQuestionnaire(
            candidateIndex,
            answers
        );
        await tx.wait();

        res.json({
            success: true,
            message: "Questionnaire submitted successfully",
            candidateIndex: candidateIndex
        });
    } catch (error) {
        console.error("Error submitting questionnaire:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/candidate-answers/:index", async (req, res) => {
    try {
        const candidateIndex = parseInt(req.params.index);
        const [answers, hasFilled] = await contractInstance.getCandidateAnswers(candidateIndex);

        res.json({
            success: true,
            candidateIndex: candidateIndex,
            answers: answers.map(a => a.toNumber ? a.toNumber() : a),
            hasFilledQuestionnaire: hasFilled
        });
    } catch (error) {
        console.error("Error getting candidate answers:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/calculate-match", async (req, res) => {
    try {
        const { voterAnswers } = req.body;
        
        if (!Array.isArray(voterAnswers) || voterAnswers.length !== 3) {
            return res.status(400).json({ error: "Must provide exactly 3 answers" });
        }

        const validAnswers = voterAnswers.every(a => a === -1 || a === 0 || a === 1);
        if (!validAnswers) {
            return res.status(400).json({ error: "Answers must be -1, 0, or 1" });
        }

        const [names, votes] = await contractInstance.getAllVotesOfCandidates();
        const matches = [];

        for (let i = 0; i < names.length; i++) {
            try {
                const [candidateAnswers, hasFilled] = await contractInstance.getCandidateAnswers(i);
                
                if (hasFilled) {
                    const score = await contractInstance.calculateMatch(voterAnswers, i);
                    matches.push({
                        candidateIndex: i,
                        candidateName: names[i],
                        matchScore: score.toNumber(),
                        answers: candidateAnswers.map(a => a.toNumber ? a.toNumber() : a)
                    });
                }
            } catch (err) {
                console.log(`Candidate ${i} has no questionnaire`);
            }
        }

        matches.sort((a, b) => b.matchScore - a.matchScore);

        res.json({
            success: true,
            matches: matches,
            bestMatch: matches.length > 0 ? matches[0] : null
        });
    } catch (error) {
        console.error("Error calculating match:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/vote-anonymously", async (req, res) => {
    try {
        const { voterAnswers, voterAddress } = req.body;
        
        if (!ethers.utils.isAddress(voterAddress)) {
            return res.status(400).json({ error: "Invalid voter address" });
        }

        if (!Array.isArray(voterAnswers) || voterAnswers.length !== 3) {
            return res.status(400).json({ error: "Must provide exactly 3 answers" });
        }

        const proof = getMerkleProof(voterAddress.toLowerCase());
        
        const tx = await contractInstance.voteAnonymously(voterAnswers, proof);
        await tx.wait();

        const receipt = await provider.getTransactionReceipt(tx.hash);
        const event = receipt.logs.find(log => {
            try {
                const parsed = contractInstance.interface.parseLog(log);
                return parsed.name === "AnonymousVoteCast";
            } catch {
                return false;
            }
        });

        let matchedCandidate = null;
        let matchScore = null;

        if (event) {
            const parsed = contractInstance.interface.parseLog(event);
            matchedCandidate = parsed.args.matchedCandidateIndex.toNumber();
            matchScore = parsed.args.matchScore.toNumber();
        }

        res.json({
            success: true,
            message: "Anonymous vote cast successfully",
            transactionHash: tx.hash,
            matchedCandidateIndex: matchedCandidate,
            matchScore: matchScore
        });
    } catch (error) {
        console.error("Error voting anonymously:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/vote", async (req, res) => {
    try {
        const candidateName = req.body.vote;
        const votingActive = await contractInstance.getVotingStatus();
        
        if (!votingActive) {
            return res.send("Voting is finished or not started yet.");
        }

        const ownerAddress = await contractInstance.owner();
        if (ownerAddress.toLowerCase() !== signer.address.toLowerCase()) {
            return res.send("You are not the owner. Only the owner can add candidates.");
        }

        const tx = await contractInstance.addCandidate(candidateName);
        await tx.wait();

        res.send("The candidate has been registered in the smart contract.");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error: " + error.message);
    }
});

app.post("/api/add-voters", async (req, res) => {
    try {
        const { addresses } = req.body;
        
        if (!Array.isArray(addresses) || addresses.length === 0) {
            return res.status(400).json({ error: "Please provide an array of addresses" });
        }

        const validAddresses = addresses.filter(addr => ethers.utils.isAddress(addr));
        
        if (validAddresses.length === 0) {
            return res.status(400).json({ error: "No valid addresses provided" });
        }

        votersList = [...new Set(validAddresses.map(addr => addr.toLowerCase()))];
        merkleTree = createMerkleTree(votersList);
        const root = merkleTree.getHexRoot();

        const tx = await contractInstance.setMerkleRoot(root);
        await tx.wait();

        res.json({
            success: true,
            merkleRoot: root,
            totalVoters: votersList.length,
            voters: votersList
        });
    } catch (error) {
        console.error("Error adding voters:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/merkle-proof/:address", (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        
        if (!ethers.utils.isAddress(address)) {
            return res.status(400).json({ error: "Invalid address" });
        }

        if (!merkleTree || votersList.length === 0) {
            return res.status(404).json({ 
                error: "No voters list found. Please add voters first.",
                proof: []
            });
        }

        const proof = getMerkleProof(address);
        const isInList = votersList.includes(address);

        res.json({
            address: address,
            isInVotersList: isInList,
            proof: proof,
            merkleRoot: merkleTree.getHexRoot()
        });
    } catch (error) {
        console.error("Error getting proof:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/voters-list", (req, res) => {
    try {
        res.json({
            totalVoters: votersList.length,
            voters: votersList,
            merkleRoot: merkleTree ? merkleTree.getHexRoot() : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/vote-with-proof", async (req, res) => {
    try {
        const { candidateIndex, voterAddress } = req.body;
        
        if (!ethers.utils.isAddress(voterAddress)) {
            return res.status(400).json({ error: "Invalid voter address" });
        }

        const proof = getMerkleProof(voterAddress.toLowerCase());

        const tx = await contractInstance.vote(candidateIndex, proof);
        await tx.wait();

        res.json({
            success: true,
            message: "Vote cast successfully",
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error("Error voting:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/contract-info", async (req, res) => {
    try {
        const [names, votes] = await contractInstance.getAllVotesOfCandidates();
        const votingStatus = await contractInstance.getVotingStatus();
        const remainingTime = await contractInstance.getRemainingTime();
        const owner = await contractInstance.owner();
        const merkleStatus = await contractInstance.getMerkleStatus();

        res.json({
            contractAddress: CONTRACT_ADDRESS,
            owner: owner,
            votingStatus: votingStatus,
            remainingTime: remainingTime.toString(),
            merkleRoot: merkleStatus.root,
            merkleEnabled: merkleStatus.enabled,
            localVotersCount: votersList.length,
            candidates: names.map((name, i) => ({
                index: i,
                name: name,
                votes: votes[i].toString()
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`App is listening on port ${port}`);
    console.log(`Server: http://localhost:${port}`);
});
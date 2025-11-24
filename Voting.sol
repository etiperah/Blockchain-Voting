// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IETIToken {
    function mint(address to, uint256 amount) external returns (bool);
}

/**
 * @dev ספריית MerkleProof לאימות הוכחות Merkle
 */
library MerkleProof {
    function verify(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        return processProof(proof, leaf) == root;
    }

    function processProof(bytes32[] memory proof, bytes32 leaf) internal pure returns (bytes32) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            computedHash = _hashPair(computedHash, proof[i]);
        }
        return computedHash;
    }

    function _hashPair(bytes32 a, bytes32 b) private pure returns (bytes32) {
        return a < b ? _efficientHash(a, b) : _efficientHash(b, a);
    }

    function _efficientHash(bytes32 a, bytes32 b) private pure returns (bytes32 value) {
        assembly {
            mstore(0x00, a)
            mstore(0x20, b)
            value := keccak256(0x00, 0x40)
        }
    }
}

contract Voting {
    using MerkleProof for bytes32[];

    struct Candidate {
        string name;
        uint256 voteCount;
        bool hasFilledQuestionnaire;
        int8[3] answers; // תשובות לשלוש שאלות: -1 (נגד), 0 (ניטרלי), 1 (בעד)
    }

    Candidate[] public candidates;
    address public owner;
    mapping(address => bool) public voters;
    address[] public votersList;

    uint256 public votingStart;
    uint256 public votingEnd;
    
    // שאלות השאלון
    string[3] public questions;
    
    // Merkle Tree for voter eligibility
    bytes32 public merkleRoot;
    bool public merkleEnabled;
    
    // Rewards system (optional)
    IETIToken public etiToken;
    uint256 public rewardPerVote;
    bool public rewardsEnabled;
    bool public rewardsDistributed;

    event CandidateAdded(string name, uint256 index);
    event VoteCast(address indexed voter, uint256 candidateIndex);
    event AnonymousVoteCast(address indexed voter, uint256 matchedCandidateIndex, uint256 matchScore);
    event QuestionnaireSubmitted(uint256 candidateIndex);
    event QuestionsUpdated();
    event VotingWindowSet(uint256 startTime, uint256 endTime);
    event RewardDistributed(address indexed voter, uint256 amount);
    event RewardsDistributedToAll(uint256 totalVoters, uint256 totalAmount);
    event RewardsEnabled(address tokenAddress, uint256 rewardAmount);
    event RewardsDisabled();
    event MerkleRootSet(bytes32 indexed newRoot);
    event MerkleEnabled();
    event MerkleDisabled();

    constructor(string[] memory _candidateNames, uint256 _durationInMinutes) {
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({ 
                name: _candidateNames[i], 
                voteCount: 0,
                hasFilledQuestionnaire: false,
                answers: [int8(0), int8(0), int8(0)]
            }));
        }
        owner = msg.sender;
        votingStart = block.timestamp;
        votingEnd = block.timestamp + (_durationInMinutes * 1 minutes);
        rewardsEnabled = false;
        merkleEnabled = false;
        
        // הגדרת שאלות ברירת מחדל
        questions[0] = "Do you support increasing education budget?";
        questions[1] = "Do you support increasing defense budget?";
        questions[2] = "Do you support reducing taxes?";
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier votingActive {
        require(block.timestamp >= votingStart, "Voting has not started yet");
        require(block.timestamp < votingEnd, "Voting has ended");
        _;
    }

    modifier votingEnded {
        require(block.timestamp >= votingEnd, "Voting has not ended yet");
        _;
    }

    // ========== פונקציות שאלון ==========

    /**
     * @dev עדכון השאלות (רק owner)
     */
    function setQuestions(string[3] memory _questions) external onlyOwner {
        questions[0] = _questions[0];
        questions[1] = _questions[1];
        questions[2] = _questions[2];
        emit QuestionsUpdated();
    }

    /**
     * @dev קבלת השאלות
     */
    function getQuestions() external view returns (string[3] memory) {
        return questions;
    }

    /**
     * @dev מילוי שאלון על ידי מועמד (רק owner יכול למלא בשם מועמד)
     */
    function submitCandidateQuestionnaire(
        uint256 _candidateIndex, 
        int8[3] memory _answers
    ) external onlyOwner {
        require(_candidateIndex < candidates.length, "Invalid candidate index");
        require(_answers[0] >= -1 && _answers[0] <= 1, "Answer 1 must be -1, 0, or 1");
        require(_answers[1] >= -1 && _answers[1] <= 1, "Answer 2 must be -1, 0, or 1");
        require(_answers[2] >= -1 && _answers[2] <= 1, "Answer 3 must be -1, 0, or 1");
        
        candidates[_candidateIndex].answers = _answers;
        candidates[_candidateIndex].hasFilledQuestionnaire = true;
        
        emit QuestionnaireSubmitted(_candidateIndex);
    }

    /**
     * @dev קבלת תשובות מועמד
     */
    function getCandidateAnswers(uint256 _candidateIndex) 
        external 
        view 
        returns (int8[3] memory, bool) 
    {
        require(_candidateIndex < candidates.length, "Invalid candidate index");
        return (
            candidates[_candidateIndex].answers,
            candidates[_candidateIndex].hasFilledQuestionnaire
        );
    }

    /**
     * @dev חישוב התאמה בין תשובות בוחר למועמד
     * ציון: 0 הפרש = 100 נקודות, 1 הפרש = 50 נקודות, 2 הפרש = 0 נקודות
     */
    function calculateMatch(
        int8[3] memory voterAnswers,
        uint256 candidateIndex
    ) public view returns (uint256) {
        require(candidateIndex < candidates.length, "Invalid candidate index");
        require(
            candidates[candidateIndex].hasFilledQuestionnaire,
            "Candidate has not filled questionnaire"
        );
        
        int8[3] memory candidateAnswers = candidates[candidateIndex].answers;
        uint256 score = 0;
        
        for (uint256 i = 0; i < 3; i++) {
            int8 diff = voterAnswers[i] - candidateAnswers[i];
            if (diff < 0) diff = -diff; // ערך מוחלט
            
            if (diff == 0) {
                score += 100;
            } else if (diff == 1) {
                score += 50;
            }
            // diff == 2 -> 0 points
        }
        
        return score;
    }

    /**
     * @dev מציאת המועמד המתאים ביותר לתשובות הבוחר
     */
    function findBestMatch(int8[3] memory voterAnswers) 
        public 
        view 
        returns (uint256 bestCandidateIndex, uint256 bestScore) 
    {
        require(candidates.length > 0, "No candidates available");
        
        bestScore = 0;
        bestCandidateIndex = 0;
        bool foundValidCandidate = false;
        
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].hasFilledQuestionnaire) {
                uint256 score = calculateMatch(voterAnswers, i);
                if (!foundValidCandidate || score > bestScore) {
                    bestScore = score;
                    bestCandidateIndex = i;
                    foundValidCandidate = true;
                }
            }
        }
        
        require(foundValidCandidate, "No candidates with questionnaire found");
        return (bestCandidateIndex, bestScore);
    }

    /**
     * @dev הצבעה אנונימית באמצעות שאלון
     * הבוחר עונה על השאלון והמערכת מתאימה אותו למועמד הכי קרוב
     */
    function voteAnonymously(
        int8[3] memory voterAnswers,
        bytes32[] memory _merkleProof
    ) external votingActive {
        require(!voters[msg.sender], "You have already voted");
        
        // אימות Merkle (אם מופעל)
        if (merkleEnabled) {
            require(merkleRoot != bytes32(0), "Merkle root not set");
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            require(
                _merkleProof.verify(merkleRoot, leaf),
                "Invalid Merkle proof - not authorized to vote"
            );
        }
        
        // בדיקת תשובות
        require(voterAnswers[0] >= -1 && voterAnswers[0] <= 1, "Invalid answer 1");
        require(voterAnswers[1] >= -1 && voterAnswers[1] <= 1, "Invalid answer 2");
        require(voterAnswers[2] >= -1 && voterAnswers[2] <= 1, "Invalid answer 3");
        
        // מציאת המועמד המתאים ביותר
        (uint256 bestCandidate, uint256 matchScore) = findBestMatch(voterAnswers);
        
        // רישום ההצבעה
        voters[msg.sender] = true;
        if (rewardsEnabled) {
            votersList.push(msg.sender);
        }
        candidates[bestCandidate].voteCount++;
        
        emit AnonymousVoteCast(msg.sender, bestCandidate, matchScore);
    }

    // ========== פונקציות Merkle Tree ==========

    /**
     * @dev מגדיר את ה-Merkle Root של ספר הבוחרים
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        require(_merkleRoot != bytes32(0), "Merkle root cannot be zero");
        merkleRoot = _merkleRoot;
        emit MerkleRootSet(_merkleRoot);
    }

    /**
     * @dev מפעיל את מערכת אימות המרקל
     */
    function enableMerkle() external onlyOwner {
        require(merkleRoot != bytes32(0), "Merkle root must be set first");
        merkleEnabled = true;
        emit MerkleEnabled();
    }

    /**
     * @dev משבית את מערכת אימות המרקל
     */
    function disableMerkle() external onlyOwner {
        merkleEnabled = false;
        emit MerkleDisabled();
    }

    /**
     * @dev מאמת שכתובת נמצאת בספר הבוחרים
     */
    function verifyVoterEligibility(address _voter, bytes32[] memory _merkleProof) public view returns (bool) {
        if (!merkleEnabled) {
            return true;
        }
        
        bytes32 leaf = keccak256(abi.encodePacked(_voter));
        return _merkleProof.verify(merkleRoot, leaf);
    }

    /**
     * @dev מחזיר את מצב מערכת המרקל
     */
    function getMerkleStatus() public view returns (bool enabled, bytes32 root) {
        return (merkleEnabled, merkleRoot);
    }

    // ========== פונקציות הצבעה ==========

    /**
     * @dev הצבעה ישירה למועמד (לא דרך שאלון)
     */
    function vote(uint256 _candidateIndex, bytes32[] memory _merkleProof) public votingActive {
        require(!voters[msg.sender], "You have already voted");
        require(_candidateIndex < candidates.length, "Invalid candidate index");
        
        // אימות Merkle
        if (merkleEnabled) {
            require(
                verifyVoterEligibility(msg.sender, _merkleProof),
                "You are not eligible to vote - not in voter registry"
            );
        }
        
        candidates[_candidateIndex].voteCount++;
        voters[msg.sender] = true;
        
        if (rewardsEnabled) {
            votersList.push(msg.sender);
        }
        
        emit VoteCast(msg.sender, _candidateIndex);
    }

    /**
     * @dev מאפשר לאדמין להוסיף מועמד חדש
     */
    function addCandidate(string memory _name) public onlyOwner {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        candidates.push(Candidate({ 
            name: _name, 
            voteCount: 0,
            hasFilledQuestionnaire: false,
            answers: [int8(0), int8(0), int8(0)]
        }));
        emit CandidateAdded(_name, candidates.length - 1);
    }

    // ========== פונקציות תגמולים ==========

    /**
     * @dev מפעיל מערכת תגמולים
     */
    function enableRewards(address _etiTokenAddress, uint256 _rewardAmount) external onlyOwner {
        require(_etiTokenAddress != address(0), "Invalid token address");
        require(_rewardAmount > 0, "Reward amount must be greater than 0");
        
        etiToken = IETIToken(_etiTokenAddress);
        rewardPerVote = _rewardAmount;
        rewardsEnabled = true;
        rewardsDistributed = false;
        
        emit RewardsEnabled(_etiTokenAddress, _rewardAmount);
    }

    /**
     * @dev משבית מערכת תגמולים
     */
    function disableRewards() external onlyOwner {
        rewardsEnabled = false;
        emit RewardsDisabled();
    }

    /**
     * @dev מעדכן את כמות התגמול
     */
    function setRewardPerVote(uint256 _rewardAmount) external onlyOwner {
        require(rewardsEnabled, "Rewards are not enabled");
        rewardPerVote = _rewardAmount;
    }

    /**
     * @dev מחלק תגמולים לכל המצביעים
     */
    function distributeRewards() public votingEnded onlyOwner returns (bool) {
        require(rewardsEnabled, "Rewards are not enabled");
        require(!rewardsDistributed, "Rewards already distributed");
        require(votersList.length > 0, "No voters to reward");

        uint256 totalDistributed = 0;

        for (uint256 i = 0; i < votersList.length; i++) {
            address voter = votersList[i];
            
            bool success = etiToken.mint(voter, rewardPerVote);
            require(success, "Token minting failed");
            
            totalDistributed += rewardPerVote;
            emit RewardDistributed(voter, rewardPerVote);
        }

        rewardsDistributed = true;
        emit RewardsDistributedToAll(votersList.length, totalDistributed);
        
        return true;
    }

    function isEligibleForReward(address _voter) public view returns (bool) {
        return rewardsEnabled && voters[_voter] && !rewardsDistributed;
    }

    function getTotalVoters() public view returns (uint256) {
        if (rewardsEnabled) {
            return votersList.length;
        }
        return 0;
    }

    function getAllVoters() public view returns (address[] memory) {
        require(rewardsEnabled, "Rewards are not enabled");
        return votersList;
    }

    // ========== פונקציות עזר ==========

    function setVotingWindow(uint256 _startTime, uint256 _endTime) public onlyOwner {
        require(_startTime > block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");
        require(_endTime > block.timestamp, "End time must be in the future");
        
        votingStart = _startTime;
        votingEnd = _endTime;
        rewardsDistributed = false;
        
        emit VotingWindowSet(_startTime, _endTime);
    }

    function getAllVotesOfCandidates() public view returns (string[] memory names, uint256[] memory votes) {
        names = new string[](candidates.length);
        votes = new uint256[](candidates.length);
        for (uint i = 0; i < candidates.length; i++) {
            names[i] = candidates[i].name;
            votes[i] = candidates[i].voteCount;
        }
    }

    function getVotingStatus() public view returns (bool) {
        return (block.timestamp >= votingStart && block.timestamp < votingEnd);
    }

    function getRemainingTime() public view returns (uint256) {
        if (block.timestamp < votingStart) {
            return votingEnd - votingStart;
        }
        if (block.timestamp >= votingEnd) {
            return 0;
        }
        return votingEnd - block.timestamp;
    }

    function hasVoted(address _voter) public view returns (bool) {
        return voters[_voter];
    }

    function getCandidatesCount() public view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 _index) public view returns (string memory name, uint256 voteCount) {
        require(_index < candidates.length, "Invalid candidate index");
        Candidate memory candidate = candidates[_index];
        return (candidate.name, candidate.voteCount);
    }

    function getTimeUntilStart() public view returns (uint256) {
        if (block.timestamp >= votingStart) {
            return 0;
        }
        return votingStart - block.timestamp;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
}
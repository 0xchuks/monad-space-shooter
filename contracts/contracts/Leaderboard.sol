// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title Leaderboard
 * @notice On-chain best-score registry for Space Shooter.
 *
 * Scores are submitted with a server-issued signature so the contract
 * can trust the value came from a valid game session. The authorised
 * signer address is managed by the owner and set to the address that
 * corresponds to SIGNER_PRIVATE_KEY at deploy time.
 */
contract Leaderboard {
    using ECDSA for bytes32;

    /* ------------------------------------------------------------------ */
    /*  State                                                               */
    /* ------------------------------------------------------------------ */

    address public owner;
    address public authorizedSigner;

    /// @notice Best score ever submitted for each player.
    mapping(address => uint256) public bestScore;

    /* ------------------------------------------------------------------ */
    /*  Events                                                              */
    /* ------------------------------------------------------------------ */

    event NewBestScore(address indexed player, uint256 score);
    event AuthorizedSignerChanged(address indexed oldSigner, address indexed newSigner);

    /* ------------------------------------------------------------------ */
    /*  Modifiers                                                           */
    /* ------------------------------------------------------------------ */

    modifier onlyOwner() {
        require(msg.sender == owner, "Leaderboard: caller is not the owner");
        _;
    }

    /* ------------------------------------------------------------------ */
    /*  Constructor                                                         */
    /* ------------------------------------------------------------------ */

    constructor(address _authorizedSigner) {
        require(_authorizedSigner != address(0), "Leaderboard: zero signer address");
        owner = msg.sender;
        authorizedSigner = _authorizedSigner;
    }

    /* ------------------------------------------------------------------ */
    /*  Admin                                                               */
    /* ------------------------------------------------------------------ */

    /**
     * @notice Replace the authorized signer. Only callable by the owner.
     * @param _newSigner New signer address (must be non-zero).
     */
    function setAuthorizedSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Leaderboard: zero signer address");
        emit AuthorizedSignerChanged(authorizedSigner, _newSigner);
        authorizedSigner = _newSigner;
    }

    /* ------------------------------------------------------------------ */
    /*  Core                                                                */
    /* ------------------------------------------------------------------ */

    /**
     * @notice Submit a score for the calling player.
     *
     * The server must sign `keccak256(abi.encodePacked(player, score))` with
     * `SIGNER_PRIVATE_KEY`. The raw (non-prefixed) hash is what the contract
     * reconstructs; the EIP-191 prefix is added via `toEthSignedMessageHash`
     * before recovery so that standard `eth_sign` / `signMessage` calls work.
     *
     * @param score     The score to record.
     * @param signature 65-byte ECDSA signature produced by the authorised signer.
     */
    function submitScore(uint256 score, bytes calldata signature) external {
        // Reconstruct the message the server signed.
        bytes32 msgHash = keccak256(abi.encodePacked(msg.sender, score));

        // Add the Ethereum signed-message prefix (compatible with eth_sign / signMessage).
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(msgHash);

        // Recover and verify.
        address recovered = ethHash.recover(signature);
        require(recovered == authorizedSigner, "Leaderboard: invalid signature");

        // Update if this is a new personal best.
        if (score > bestScore[msg.sender]) {
            bestScore[msg.sender] = score;
            emit NewBestScore(msg.sender, score);
        }
    }
}

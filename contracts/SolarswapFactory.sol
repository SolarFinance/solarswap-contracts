pragma solidity =0.5.16;

import "./interfaces/ISolarswapFactory.sol";
import "./SolarswapPair.sol";

contract SolarswapFactory is ISolarswapFactory {
    bytes32 public constant INIT_CODE_PAIR_HASH =
        keccak256(abi.encodePacked(type(SolarswapPair).creationCode));

    address public feeTo;
    address public feeToSetter;

    // allFee = 1%
    // protocolFee = 0.3%
    // -> numeratorProtocolFee = 3
    // -> denominatorProtocolFee = 10
    uint256 public numeratorProtocolFee = 3;
    uint256 public denominatorProtocolFee = 10;
    uint256 public allFee = 100; // to divide with 10,000 (example: allFee = 30 -> fee = 0.3%)

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint256
    );

    modifier checkFeeToSetter() {
        require(msg.sender == feeToSetter, "Solarswap: FORBIDDEN");
        _;
    }

    constructor(address _feeToSetter) public {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB)
        external
        returns (address pair)
    {
        require(tokenA != tokenB, "Solarswap: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), "Solarswap: ZERO_ADDRESS");
        require(
            getPair[token0][token1] == address(0),
            "Solarswap: PAIR_EXISTS"
        ); // single check is sufficient
        bytes memory bytecode = type(SolarswapPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        ISolarswapPair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external checkFeeToSetter {
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external checkFeeToSetter {
        feeToSetter = _feeToSetter;
    }

    function setProtocolFee(uint256 _numeratorProtocolFee, uint256 _denominatorProtocolFee) external checkFeeToSetter {
        numeratorProtocolFee = _numeratorProtocolFee;
        denominatorProtocolFee = _denominatorProtocolFee;
    }

    function setAllFee(uint256 _allFee) external checkFeeToSetter {
        allFee = _allFee;
    }
}

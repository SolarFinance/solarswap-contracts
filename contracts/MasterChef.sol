// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "openzeppelin6/access/Ownable.sol";
import "openzeppelin6/GSN/Context.sol";
import "openzeppelin6/math/SafeMath.sol";
import "openzeppelin6/utils/Address.sol";
import "./libraries/SafeARC20.sol";
import "./libraries/ARC20.sol";
import "./libraries/WASA.sol";
import "./Treasury.sol";

// MasterChef is the master of WASA. He can make WASA and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once WASA is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract MasterChef is Ownable {
    using SafeMath for uint256;
    using SafeARC20 for IARC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of WASAs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accWASAPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accWASAPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IARC20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. WASAs to distribute per block.
        uint256 lastRewardBlock; // Last block number that WASAs distribution occurs.
        uint256 accWASAPerShare; // Accumulated WASAs per share, times 1e12. See below.
    }

    // The Treasury
    Treasury public treasury;
    // The WASA TOKEN!
    WASA public wasa;
    // WASA tokens created per block.
    uint256 public wasaPerBlock;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    // Total allocation poitns. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when WASA mining starts.
    uint256 public startBlock;

    event Add(uint256 allocPoint, address indexed lpToken);
    event Set(uint256 indexed pid, uint256 allocPoint);
    event UpdateWasaPerBlock(uint256 newWasaPerBlock);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );

    constructor(
        Treasury _treasury,
        WASA _wasa,
        uint256 _wasaPerBlock, // 2
        uint256 _startBlock
    ) public {
        treasury = _treasury;
        wasa = _wasa;
        wasaPerBlock = _wasaPerBlock;
        startBlock = _startBlock;
    }

    receive() external payable {}

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(
        uint256 _allocPoint,
        IARC20 _lpToken,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock
            ? block.number
            : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accWASAPerShare: 0
            })
        );
        emit Add(_allocPoint, _lpToken);
    }

    // Update the given pool's WASA allocation point. Can only be called by the owner.
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(
            _allocPoint
        );
        poolInfo[_pid].allocPoint = _allocPoint;
        emit Set(_pid, _allocPoint);
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to)
        public
        view
        returns (uint256)
    {
        return _to.sub(_from);
    }

    // View function to see pending WASAs on frontend.
    function pendingWASA(uint256 _pid, address _user)
        external
        view
        returns (uint256)
    {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accWASAPerShare = pool.accWASAPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(
                pool.lastRewardBlock,
                block.number
            );
            uint256 wasaReward = multiplier
                .mul(wasaPerBlock)
                .mul(pool.allocPoint)
                .div(totalAllocPoint);
            accWASAPerShare = accWASAPerShare.add(
                wasaReward.mul(1e12).div(lpSupply)
            );
        }
        return user.amount.mul(accWASAPerShare).div(1e12).sub(user.rewardDebt);
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 wasaReward = multiplier
            .mul(wasaPerBlock)
            .mul(pool.allocPoint)
            .div(totalAllocPoint);
        treasury.claim(payable(address(this)), wasaReward);
        pool.accWASAPerShare = pool.accWASAPerShare.add(
            wasaReward.mul(1e12).div(lpSupply)
        );
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to MasterChef for WASA allocation.
    function deposit(uint256 _pid, uint256 _amount) public {
        require(_pid != 0, "deposit WASA by staking");

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = user
                .amount
                .mul(pool.accWASAPerShare)
                .div(1e12)
                .sub(user.rewardDebt);
            if (pending > 0) {
                safeASATransfer(msg.sender, pending);
            }
        }
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(
                address(msg.sender),
                address(this),
                _amount
            );
            user.amount = user.amount.add(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accWASAPerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) public {
        require(_pid != 0, "withdraw WASA by unstaking");

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending = user.amount.mul(pool.accWASAPerShare).div(1e12).sub(
            user.rewardDebt
        );
        if (pending > 0) {
            safeASATransfer(msg.sender, pending);
        }
        if (_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accWASAPerShare).div(1e12);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    // Safe wasa transfer function, just in case if rounding error causes pool to not have enough WASAs.
    function safeASATransfer(address payable _to, uint256 _amount) internal {
        uint256 asaBal = address(this).balance;
        if (_amount > asaBal) {
            _to.transfer(asaBal);
        } else {
            _to.transfer(_amount);
        }
    }

    function updateWasaPerBlock(uint256 newWasaPerBlock) external onlyOwner {
        wasaPerBlock = newWasaPerBlock;
        emit UpdateWasaPerBlock(newWasaPerBlock);
    }
}

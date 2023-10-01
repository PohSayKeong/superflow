//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SafeMath.sol";

interface iUSDt {
	function transferFrom(address _from, address _to, uint256 _value) external;

	function balanceOf(address who) external view returns (uint);
}

interface ISuperToken {
	function realtimeBalanceOfNow(address account) external view returns (int256);

	function balanceOf(address account) external view returns (uint);

	function transferFrom(
		address holder,
		address recipient,
		uint256 amount
	) external;
}

interface iSuperFluid {
	function createFlow(
		address token,
		address sender,
		address receiver,
		int96 flowrate,
		bytes memory userData
	) external returns (bool);

	function deleteFlow(
		address token,
		address sender,
		address receiver,
		bytes memory userData
	) external returns (bool);

	function updateFlow(
		address token,
		address sender,
		address receiver,
		int96 flowrate,
		bytes memory userData
	) external returns (bool);

	function getFlowrate(
		address token,
		address sender,
		address receiver
	) external view returns (int96);
}

contract Subscription {
	using SafeMath for uint256;
	uint256 public numSubscriptionLevels;

	uint256 public userCountToDate;

	mapping(uint256 => address) internal nthUser;
	mapping(address => bool) internal interacted;

	// boolean values
	bool public renewalsEnabled = true;
	bool public paymentRecurring;
	bool public paymentStreaming;
	bool public USDtAccepted;
	bool public nativeAccepted;

	// name of company. initialised in constructor
	string public subscriptionName;
	address public owner;

	mapping(uint256 => uint96) public subscriptionPrices;
	//mapping(address => bool) public claimedFreeTrial;

	// stablecoin addresses for RECURRING payments. USDt
	iUSDt public USDt;

	// SuperFluid's contract address
	iSuperFluid public superFluid;

	// stablecoins addresses for STREAMING payments. USDt
	ISuperToken public USDtx;
	ISuperToken public nativex;

	// expiryTime -> determines whether user's subscription is still valid
	// subscriptionLevel -> determines the features user can access on FE
	mapping(address => uint256) public expiryTime;
	mapping(address => uint256) public userSubscriptionLevel;

	event renewedRecurring(address _addr, uint256 _expiryTime, uint256 _level);
	event renewedStreaming(address _addr, uint256 _level);
	event cancelledSubscription(address _addr);

	address USDtAddr = 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9;
	address superFluidAddr = 0x59b670e9fA9D0A427751Af201D676719a970857b;
	address USDtxAddr = 0xEBd654d18a2387c6aae129005b31aC415F1204aa;
	address nativexAddr = 0x998abeb3E57409262aE5b751f60747921B33613E;

	modifier onlyOwner() {
		require(owner == msg.sender, "you are not the owner");
		_;
	}

	constructor(
		uint96[] memory _price,
		string memory _name,
		address _owner,
		bool _USDt,
		bool _native,
		bool _recurring,
		bool _streaming
	) {
		for (uint256 i; i < _price.length; i++) {
			subscriptionPrices[i] = _price[i] * 1e18; // ether unit conversion for easier use
		}
		numSubscriptionLevels = _price.length;
		subscriptionName = _name;
		owner = _owner;
		USDtAccepted = _USDt;
		nativeAccepted = _native;
		paymentRecurring = _recurring;
		paymentStreaming = _streaming;
		USDt = iUSDt(USDtAddr);
		superFluid = iSuperFluid(superFluidAddr);
		USDtx = ISuperToken(USDtxAddr);
		nativex = ISuperToken(nativexAddr);
	}

	// NEED to call grantPermissions first on FE, for the superfluid contract.
	// there is already an in-built buffer deposit upon creating a stream
	function renewalFlow(
		address _sender,
		uint256 _stablesId,
		uint256 _level,
		bytes memory _data
	) public {
		require(renewalsEnabled, "Renewals are currently disabled");
		require(paymentStreaming, "not accepting streaming payemnts");
		require(_stablesId <= 1, "not an accepted stablecoin");
		require(_level < numSubscriptionLevels);

		// uses int96 as a param, as specificed by the superfluid contract
		// rate is in wei per second. 30 days = 86400s * 30 days
		int96 _rate = int96(subscriptionPrices[_level] / (2.592e6));

		if (_stablesId == 0) {
			//nativex
			require(nativeAccepted, "native not accepted");
			superFluid.createFlow(nativexAddr, _sender, address(this), _rate, _data);
		} else if (_stablesId == 1) {
			//usdtx
			require(USDtAccepted, "usdt not accepted");
			superFluid.createFlow(USDtxAddr, _sender, address(this), _rate, _data);
		}

		if (!interacted[_sender]) {
			nthUser[userCountToDate] = _sender;
			userCountToDate++;
			interacted[_sender] = true;
		}

		userSubscriptionLevel[_sender] = _level;
		emit renewedStreaming(_sender, _level);
	}

	function stopSubscription(
		address _sender,
		uint256 _stablesId,
		bytes memory _data
	) public {
		require(_sender == msg.sender, "you are not this streams owner!");
		require(_stablesId <= 1, "not an accepted stablecoin");

		if (_stablesId == 0) {
			//nativex
			superFluid.deleteFlow(nativexAddr, _sender, address(this), _data);
		} else if (_stablesId == 1) {
			//usdcx
			superFluid.deleteFlow(USDtxAddr, _sender, address(this), _data);
		}

		emit cancelledSubscription(_sender);
	}

	// need to approve from FE first. _stablesId refers to which stablecoin is used for payment
	function renewalMonthly(
		address _addr,
		uint256 _stablesId,
		uint256 _level
	) public {
		require(renewalsEnabled, "Renewals are currently disabled");
		require(paymentRecurring, "not accepting recurring monthly payments");
		require(_stablesId <= 1, "not an accepted stablecoin");
		require(_level < numSubscriptionLevels);
		uint256 _currentexpiryTime = expiryTime[_addr];

		if (_stablesId == 0) {
			//usdt
			require(USDtAccepted, "usdt not accepted");
			require(USDt.balanceOf(msg.sender) >= subscriptionPrices[_level]);
			USDt.transferFrom(msg.sender, address(this), subscriptionPrices[_level]);
		}

		if (block.timestamp > _currentexpiryTime) {
			expiryTime[_addr] = block.timestamp + 30 days;
		} else {
			expiryTime[_addr] += 30 days;
		}

		if (!interacted[_addr]) {
			nthUser[userCountToDate] = _addr;
			userCountToDate++;
			interacted[_addr] = true;
		}

		userSubscriptionLevel[_addr] = _level;
		emit renewedRecurring(_addr, expiryTime[_addr], _level);
	}

	// Checks if user is still paying/ paid for subscription. True if expired, false else.
	function userSubscriptionInfo(
		address _user
	) public view returns (bool expired, uint256 level) {
		bool expiredRecurring = block.timestamp > expiryTime[_user];
		bool expiredStreamingUSDtx = getUserFlowRateUSDtx(_user) <= 0;
		bool expiredStreamingnativex = getUserFlowRatenativex(_user) <= 0;
		expired =
			expiredRecurring &&
			expiredStreamingUSDtx &&
			expiredStreamingnativex;
		level = userSubscriptionLevel[_user];
	}

	function getUserFlowRateUSDtx(address _addr) internal view returns (int256) {
		return superFluid.getFlowrate(USDtxAddr, _addr, address(this));
	}

	function getUserFlowRatenativex(
		address _addr
	) internal view returns (int256) {
		return superFluid.getFlowrate(nativexAddr, _addr, address(this));
	}

	// rerturns num active users and monthly inflow the contract
	function getInfo() internal view returns (uint256, uint256) {
		uint256 numActive;
		uint256 netFlow;
		for (uint i; i < userCountToDate; i++) {
			address curr = nthUser[i];
			(bool a, ) = userSubscriptionInfo(curr);
			(, uint256 b) = userSubscriptionInfo(curr);
			if (!a) {
				numActive++;
				netFlow = netFlow + uint256(subscriptionPrices[b]);
			}
		}
		return (numActive, netFlow);
	}

	// main function REQUIRED for SuperFluid FE integration
	function getDetails() public view returns (uint256[] memory) {
		uint256[] memory detailList = new uint256[](4);
		uint256 sumBalance = uint256(USDt.balanceOf(address(this))) +
			uint256(USDtx.balanceOf(address(this))) +
			uint256(address(this).balance) +
			uint256(nativex.balanceOf(address(this)));
		detailList[0] = sumBalance;

		(uint256 numActive, ) = getInfo();
		detailList[1] = numActive;

		detailList[2] = userCountToDate;

		(, uint256 netFlow) = getInfo();
		detailList[3] = netFlow;

		return detailList;
	}

	function renewalAdmin(
		address _addr,
		uint256 _level,
		uint256 _days
	) public onlyOwner {
		require(_level < numSubscriptionLevels);
		uint256 _currentexpiryTime = expiryTime[_addr];

		if (block.timestamp > _currentexpiryTime) {
			expiryTime[_addr] = block.timestamp + _days * 1 days;
		} else {
			expiryTime[_addr] += _days * 1 days;
		}

		if (!interacted[_addr]) {
			nthUser[userCountToDate] = _addr;
			userCountToDate++;
			interacted[_addr] = true;
		}

		userSubscriptionLevel[_addr] = _level;
		emit renewedRecurring(_addr, expiryTime[_addr], _level);
	}

	function toggleRenewalsActive(bool _state) external onlyOwner {
		renewalsEnabled = _state;
	}

	// to counter inflation
	function updateSubscriptionPrice(
		uint96[] memory _newPrices
	) external onlyOwner {
		for (uint256 i; i < _newPrices.length; i++) {
			subscriptionPrices[i] = _newPrices[i] * 1e18;
		}
		numSubscriptionLevels = _newPrices.length;
	}

	function togglePayment(bool _recurring, bool _streaming) external onlyOwner {
		paymentRecurring = _recurring;
		paymentStreaming = _streaming;
	}

	function transferOwnership(address newOwner) public virtual onlyOwner {
		require(newOwner != address(0), "new owner cannot be zero address");
		owner = newOwner;
	}

	// draining the contract of all cryptos
	function withdraw() public onlyOwner {
		uint balance = address(this).balance;
		(bool success, ) = (msg.sender).call{ value: balance }("");
		if (USDt.balanceOf(address(this)) > 0) {
			USDt.transferFrom(
				address(this),
				msg.sender,
				USDt.balanceOf(address(this))
			);
		}
		if (USDtx.balanceOf(address(this)) > 0) {
			USDtx.transferFrom(
				address(this),
				msg.sender,
				USDtx.balanceOf(address(this))
			);
		}
		if (nativex.balanceOf(address(this)) > 0) {
			nativex.transferFrom(
				address(this),
				msg.sender,
				nativex.balanceOf(address(this))
			);
		}
		require(success, "Transfer failed.");
	}
}

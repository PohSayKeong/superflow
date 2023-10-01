import { useState } from "react"
import styles from "./WrapToken.module.css"
import { isMounted } from "../hooks/isMounted"
import {
	useAccount,
	useBalance,
	useContractRead,
	useSendTransaction,
} from "wagmi"
import { formatEther, parseEther } from "viem"

const nativexAddr = "0x998abeb3E57409262aE5b751f60747921B33613E"

function WrapToken() {
	const [amount, setAmount] = useState("0")
	const [balance, setBalance] = useState("0")
	const [isLoading, setIsLoading] = useState(false)
	const mounted = isMounted()
	const { address, isConnected } = useAccount()
	const { data: nativeBalance } = useBalance({ address, watch: true })

	useContractRead({
		//FACTORY
		address: nativexAddr as `0x${string}`,
		abi: [
			{
				inputs: [{ internalType: "address", name: "account", type: "address" }],
				name: "balanceOf",
				outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
				stateMutability: "view",
				type: "function",
			},
		],
		functionName: "balanceOf",
		args: [address],
		watch: true,
		onSuccess(data) {
			setBalance(formatEther(data))
		},
	})

	const { sendTransaction } = useSendTransaction({
		to: nativexAddr,
		value: parseEther(amount),
	})

	function handleChange(event: Event) {
		if (!event.target) return
		const target = event.target as HTMLInputElement
		setAmount(target.value)
	}

	function handleSubmit(event: Event) {
		event.preventDefault()
		setIsLoading(true)
		sendTransaction()
	}

	return (
		<main className={styles.scene}>
			<div id="card" className={styles.card}>
				<form
					id="mainForm"
					className={`${styles.card__face} ${styles.card__face__front}`}
					onSubmit={handleSubmit}
				>
					<div className={styles.headerTag}>
						<p className={styles.headerTagTxt}>Wrap Tokens</p>
					</div>
					<p className={styles.balance}>
						XRP balance:{" "}
						{`${
							nativeBalance
								? parseFloat(nativeBalance.formatted).toPrecision(7)
								: 0
						}`}
					</p>
					<p className={styles.balance}>XRPx balance: {balance}</p>
					<br />
					<label>
						Amount to wrap:
						<input
							type="text"
							name="amount"
							placeholder="100"
							value={amount}
							onChange={handleChange}
							className={styles.text_input}
							required
						/>
					</label>
					<div>
						{mounted && isConnected && (
							<button
								type="submit"
								className={styles.submit_btn}
								disabled={isLoading}
								data-mint-loading={isLoading}
								// data-mint-started={isSuccess}
							>
								Wrap
							</button>
						)}
					</div>
				</form>
			</div>
		</main>
	)
}

export default WrapToken

import styles from "./DashboardTable.module.css"
import subscriptionAbi from "../artifacts/contracts/fintech_subscription.sol/Subscription.json"
import {
	useAccount,
	useContractRead,
	useContractReads,
	useContractWrite,
	usePrepareContractWrite,
} from "wagmi"
import { cfaAbi } from "../utils/cfaAbi"
import { useEffect, useState } from "react"

const usdtxAddress = "0xEBd654d18a2387c6aae129005b31aC415F1204aa"
const nativexAddress = "0x998abeb3E57409262aE5b751f60747921B33613E"
const cfaAddress = "0x59b670e9fA9D0A427751Af201D676719a970857b"

interface DashboardTableProps {
	dataList: any
	contractAddress: string
}

function DashboardTable({ dataList, contractAddress }: DashboardTableProps) {
	const { address } = useAccount()
	const [isLoading, setIsLoading] = useState(true)
	const [permissionGranted, setPermissionGranted] = useState(false)
	const [token, setToken] = useState(0)
	const superToken = token ? usdtxAddress : nativexAddress

	const handleButtonClick = () => {
		if (!permissionGranted && grantPermission) {
			grantPermission()
			setIsLoading(true)
		} else if (subscribe) {
			subscribe()
			setIsLoading(true)
		}
	}

	const { error } = useContractReads({
		contracts: [
			{
				address: contractAddress as `0x${string}`,
				abi: subscriptionAbi.abi,
				functionName: "nativeAccepted",
			},
			{
				address: contractAddress as `0x${string}`,
				abi: subscriptionAbi.abi,
				functionName: "USDtAccepted",
			},
		],
		onSuccess(data) {
			data.forEach((token, index) => {
				if (token.result) {
					setToken(index)
				}
			})
		},
	})

	useContractRead({
		address: cfaAddress,
		abi: cfaAbi,
		functionName: "getFlowOperatorPermissions",
		watch: true,
		args: [nativexAddress, address, contractAddress],
		onSuccess(data: any[]) {
			setPermissionGranted(data[1] != 0)
		},
	})

	const { config: permissionConfig } = usePrepareContractWrite({
		address: cfaAddress,
		abi: cfaAbi,
		functionName: "grantPermissions",
		args: [superToken, contractAddress],
	})

	const { isLoading: permLoading, write: grantPermission } =
		useContractWrite(permissionConfig)

	const { config: subscribeConfig } = usePrepareContractWrite({
		address: contractAddress as `0x${string}`,
		abi: subscriptionAbi.abi,
		functionName: "renewalFlow",
		args: [address, 0, 0, "0x00"],
	})

	const { isLoading: subscribeLoading, write: subscribe } =
		useContractWrite(subscribeConfig)

	useEffect(() => {
		setIsLoading(permLoading || subscribeLoading)
	}, [permLoading, subscribeLoading])

	return (
		<table className={styles.table}>
			<thead>
				<tr>
					<td className={styles.tableheader}>
						Contract address: {contractAddress}
					</td>
				</tr>
			</thead>
			<tbody>
				<tr className={styles.subheader}>
					<td className={styles.subheaderAsset}>Asset</td>
					<td className={styles.subheaderText}>Balance</td>
					<td className={styles.subheaderText}>Active Users</td>
					<td className={styles.subheaderText}>Total Users</td>
					<td className={styles.subheaderText}>Monthly Inflow</td>
				</tr>

				<tr className={styles.content}>
					<td className={styles.contentAsset}>{token ? "USD" : "XRP"}</td>
					<td className={styles.contentBalance}>
						{dataList[0] && dataList[0].toFixed(5)}
					</td>
					<td className={styles.content_text}>{dataList[1] && dataList[1]}</td>
					<td className={styles.content_text}>{dataList[2] && dataList[2]}</td>
					<td className={styles.content_text} style={{ color: "green" }}>
						+{dataList[3] && dataList[3].toFixed(5)}
					</td>
				</tr>

				<tr>
					<td>
						<button
							className={styles.submit_btn}
							onClick={handleButtonClick}
							disabled={isLoading}
							data-mint-loading={isLoading}
							// data-mint-started={isSuccess}
						>
							{isLoading
								? "Loading"
								: !permissionGranted
								? "Grant Permission"
								: "Subscribe"}
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	)
}

export default DashboardTable

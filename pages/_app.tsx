import "../styles/globals.css"
import type { AppProps } from "next/app"
import { Ubuntu } from "@next/font/google"
import "@rainbow-me/rainbowkit/styles.css"
import {
	getDefaultWallets,
	RainbowKitProvider,
	darkTheme,
} from "@rainbow-me/rainbowkit"
import { configureChains, createConfig, WagmiConfig } from "wagmi"
import { goerli, localhost } from "wagmi/chains"
import { alchemyProvider } from "wagmi/providers/alchemy"
import { publicProvider } from "wagmi/providers/public"

const ubuntu = Ubuntu({
	weight: ["400", "500", "700"],
	subsets: ["latin"],
})

const { chains, publicClient } = configureChains(
	// we'll be using goerli for testing
	[goerli, localhost],
	//api key to add to .env later. but adding here so everyone can use for now
	[
		alchemyProvider({ apiKey: "9RscFf-M5Wz5EMfVOcX9Wnic6kAUMB6r" }),
		publicProvider(),
	]
)

const { connectors } = getDefaultWallets({
	appName: "SuperFlow",
	projectId: "a785e0aa86a2f806c766b49f9d2d7983",
	chains,
})

const wagmiConfig = createConfig({
	autoConnect: true,
	connectors,
	publicClient,
})

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<div className={ubuntu.className}>
			<WagmiConfig config={wagmiConfig}>
				<RainbowKitProvider
					chains={chains}
					theme={darkTheme({
						accentColor: "black",
						accentColorForeground: "white",
						borderRadius: "medium",
						fontStack: "system",
						overlayBlur: "small",
					})}
				>
					<Component {...pageProps} />
				</RainbowKitProvider>
			</WagmiConfig>
		</div>
	)
}

export default MyApp

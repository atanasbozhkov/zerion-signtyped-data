import { useAccount, useConnect, useDisconnect, useSignTypedData } from "wagmi";
import { Hash, verifyTypedData } from "viem";
import { useCallback, useState } from "react";

export const getJamParamTypes = () => {
  return {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ],
    JamOrder: [
      { name: "taker", type: "address" },
      { name: "receiver", type: "address" },
      { name: "expiry", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "executor", type: "address" },
      { name: "minFillPercent", type: "uint16" },
      { name: "hooksHash", type: "bytes32" },
      { name: "sellTokens", type: "address[]" },
      { name: "buyTokens", type: "address[]" },
      { name: "sellAmounts", type: "uint256[]" },
      { name: "buyAmounts", type: "uint256[]" },
      { name: "sellNFTIds", type: "uint256[]" },
      { name: "buyNFTIds", type: "uint256[]" },
      { name: "sellTokenTransfers", type: "bytes" },
      { name: "buyTokenTransfers", type: "bytes" },
    ],
  } as const;
};

function App() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { signTypedData } = useSignTypedData();
  const [result, setResult] = useState<any>("");

  const handleSigVerify = useCallback(
    ({
      message,
      settlementAddress,
      chainId,
      signature,
    }: {
      message: any;
      settlementAddress: Hash;
      chainId: number;
      signature: Hash;
    }) => {
      return verifyTypedData({
        address: message.taker,
        domain: {
          name: "JamSettlement",
          version: "1",
          chainId: chainId as unknown as bigint,
          verifyingContract: settlementAddress,
        } as const,
        types: getJamParamTypes(),
        primaryType: "JamOrder" as const,
        message: message,
        signature,
      });
    },
    []
  );

  /**
   * Bug Repro:
   * 1. Sign the typed data (include the user address in taker and reciever in the message)
   * 2. After signing get the result and verify the signature using verifyTypedData
   * 3. On Desktop it works fine - but on mobile the result is invalid
   */
  const handleSignTypedData = useCallback(() => {
    const message = {
      expiry: BigInt("1709130802"),
      taker: account.address,
      receiver: account.address,
      executor: "0x88888B0Bb396637Ad42eFffae87787E3E29f9b0e",
      minFillPercent: 10000,
      nonce: BigInt("110230676287853616448084036775904069764"),
      hooksHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      sellTokens: ["0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a"],
      buyTokens: ["0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"],
      sellAmounts: [BigInt("216993351219596809")],
      buyAmounts: [BigInt("7016666")],
      sellNFTIds: [],
      buyNFTIds: [],
      sellTokenTransfers: "0x03",
      buyTokenTransfers: "0x00",
    };
    signTypedData(
      {
        message,
        types: getJamParamTypes(),
        primaryType: "JamOrder",
        domain: {
          name: "JamSettlement",
          version: "1",
          chainId: 137 as unknown as bigint,
          verifyingContract: "0x88888B0Bb396637Ad42eFffae87787E3E29f9b0e",
        } as const,
      },
      {
        onSuccess: (sig) => {
          console.log(sig);
          setResult(sig);
          handleSigVerify({
            message,
            settlementAddress: "0x88888B0Bb396637Ad42eFffae87787E3E29f9b0e",
            chainId: 137,
            signature: sig,
          })
            .then((result) => {
              console.log(`Sig verify result`, result);
              setResult(result);
            })
            .catch((e) => {
              console.error(`Could not verify signature`, e);
              setResult(e.message);
            });
        },
      }
    );
  }, [account, signTypedData, setResult]);
  return (
    <>
      <div>
        <h2>Account</h2>

        <div>
          status: {account.status}
          <br />
          addresses: {JSON.stringify(account.addresses)}
          <br />
          chainId: {account.chainId}
        </div>

        {account.status === "connected" && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
        <div>{error?.message}</div>
      </div>
      <div>
        <div> Bug Repro </div>
        <button onClick={handleSignTypedData}> Sign typed data </button>
        <div>Sig Verification Result: {JSON.stringify(result)}</div>
      </div>
    </>
  );
}

export default App;

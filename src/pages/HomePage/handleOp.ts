import { ethers } from "ethers";
import { UserOperation } from "./UserOperation";
import { defaultAbiCoder, keccak256 } from "ethers/lib/utils";
import AccountAbi from "../../ABI/Account.json";
import EntrypointAbi from "../../ABI/EntryPoint.json";
import ERC721ABI from "../../ABI/ERC721.json";
import ERC1155ABI from "../../ABI/ERC1155.json";
const provider = new ethers.providers.JsonRpcProvider(
    "https://data-seed-prebsc-1-s1.binance.org:8545"
);
const entryPoint = new ethers.Contract(
    "0x91Bf50D45d66BCebeC525DbD54FBF6257fFe759E",
    EntrypointAbi,
    provider
);
// encode
function encode(
    typevalues: Array<{ type: string; val: any }>,
    forSignature: boolean
): string {
    const types = typevalues.map((typevalue) =>
        typevalue.type === "bytes" && forSignature ? "bytes32" : typevalue.type
    );
    const values = typevalues.map((typevalue) =>
        typevalue.type === "bytes" && forSignature
            ? keccak256(typevalue.val)
            : typevalue.val
    );
    return defaultAbiCoder.encode(types, values);
}

// helper to pack UserOperation
export function packUserOp(op: UserOperation, forSignature = true): string {
    if (forSignature) {
        // lighter signature scheme (must match UserOperation#pack): do encode a zero-length signature, but strip afterwards the appended zero-length value
        const userOpType = {
            components: [
                { type: "address", name: "sender" },
                { type: "uint256", name: "nonce" },
                { type: "bytes", name: "initCode" },
                { type: "bytes", name: "callData" },
                { type: "uint256", name: "callGasLimit" },
                { type: "uint256", name: "verificationGasLimit" },
                { type: "uint256", name: "preVerificationGas" },
                { type: "uint256", name: "maxFeePerGas" },
                { type: "uint256", name: "maxPriorityFeePerGas" },
                { type: "bytes", name: "paymasterAndData" },
                { type: "bytes", name: "signature" },
            ],
            name: "userOp",
            type: "tuple",
        };
        let encoded = defaultAbiCoder.encode(
            [userOpType as any],
            [{ ...op, signature: "0x" }]
        );
        // remove leading word (total length) and trailing word (zero-length signature)
        encoded = "0x" + encoded.slice(66, encoded.length - 64);
        return encoded;
    }
    const typevalues = [
        { type: "address", val: op.sender },
        { type: "uint256", val: op.nonce },
        { type: "bytes", val: op.initCode },
        { type: "bytes", val: op.callData },
        { type: "uint256", val: op.callGasLimit },
        { type: "uint256", val: op.verificationGasLimit },
        { type: "uint256", val: op.preVerificationGas },
        { type: "uint256", val: op.maxFeePerGas },
        { type: "uint256", val: op.maxPriorityFeePerGas },
        { type: "bytes", val: op.paymasterAndData },
    ];
    if (!forSignature) {
        // for the purpose of calculating gas cost, also hash signature
        typevalues.push({ type: "bytes", val: op.signature });
    }
    return encode(typevalues, forSignature);
}

export async function fillUserOp(
    sender: string,
    callData: string
): Promise<UserOperation> {
    const accountIns = new ethers.Contract(sender, AccountAbi, provider);
    let nonce = (await accountIns.getNonce()).toNumber();
    let op: UserOperation = {
        sender,
        callData,
        nonce,
        initCode: "0x",
        callGasLimit: 30000,
        verificationGasLimit: 300000,
        preVerificationGas: 0,
        maxFeePerGas: "10000000000",
        maxPriorityFeePerGas: "10000000000",
        signature: "0x",
        paymasterAndData: "0x",
    };
    try {
        const gasEtimated = await provider.estimateGas({
            from: entryPoint?.address,
            to: op.sender,
            data: op.callData,
        });
        op.callGasLimit = gasEtimated.toNumber(); // .add(55000)
    } catch {
        op.callGasLimit = 1000000;
    }
    return op;
}
//helper to sign message
export async function signUserOp(
    op: UserOperation,
    owner?: ethers.Wallet
): Promise<UserOperation> {
    let ownerSig: any;
    console.log("op: ", op);
    const structString = ethers.utils.defaultAbiCoder.encode(
        // Replace with the types of your struct fields
        [
            "address",
            "uint256",
            "bytes",
            "bytes",
            "uint256",
            "uint256",
            "uint256",
            "uint256",
            "uint256",
            "bytes",
            "bytes",
        ],
        // Replace with the values of your struct fields
        [
            op.sender,
            op.nonce,
            op.initCode,
            op.callData,
            op.callGasLimit,
            op.verificationGasLimit,
            op.preVerificationGas,
            op.maxFeePerGas,
            op.maxPriorityFeePerGas,
            op.paymasterAndData,
            op.signature,
        ]
    );
    console.log("struct str", structString);
    const message = await entryPoint.getUserOpHash(op);

    console.log("mess: ", message);
    if (owner) {
        ownerSig = await signMessage(message, owner);
    }

    return {
        ...op,
        signature: ownerSig,
    };
}
export async function submitOp(sender: ethers.Wallet, op: UserOperation) {
    try {
        console.log([op]);
        const tx = await entryPoint
            .connect(sender.connect(provider))
            .handleOps([op], "0xD03827055dA3e847abD2D59b9ca74A8897A1fABb", {
                gasLimit: 500000,
            });
        const receipt = await tx.wait();
        return receipt;
    } catch (error) {
        console.error("err:", error);
    }
}

export async function signMessage(
    message: string,
    signer: ethers.Wallet
): Promise<string> {
    const sig = await signer.signMessage(ethers.utils.arrayify(message));

    let v = parseInt(sig.substring(130, 132), 16);

    if (v < 27) v += 27;

    const normalizedSig = `${sig.substring(0, 130)}${v.toString(16)}`;

    return normalizedSig;
}
//helper to encode Function (helper low lv call) -> callData
export function encodeFunction(
    type: string,
    func: string,
    params: any[]
): string {
    let abi: string = "";
    if (type === "erc721") {
        abi = JSON.stringify(ERC721ABI);
    } else if (type === "erc1155") {
        abi = JSON.stringify(ERC1155ABI);
    } else if (type === "account") {
        abi = JSON.stringify(AccountAbi);
    }
    const accountInterface = new ethers.utils.Interface(abi);
    const args = params;
    return accountInterface.encodeFunctionData(func, args);
}

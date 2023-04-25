import React, { useEffect, useState } from "react";
import { ethers, BigNumber } from "ethers";
import { Box, Button, TextField, Modal, Snackbar, Alert } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";

import contractABI from "../../ABI/contract.json";
import ERC721ABI from "../../ABI/ERC721.json";
import ERC1155ABI from "../../ABI/ERC1155.json";
import { encodeFunction, fillUserOp, signUserOp, submitOp } from "./handleOp";
import { database } from "../../firebase";
import { ref, child, get } from "firebase/database";
import CircularProgress from "@mui/material/CircularProgress";
import { useLocation, useHistory } from "react-router-dom";

const dbRef = ref(database);
const crypto = require("crypto");
const provider = new ethers.providers.JsonRpcProvider(
    "https://data-seed-prebsc-1-s1.binance.org:8545"
);
const admin = new ethers.Wallet(
    "7f4255d3db299284cfbb33ab57478e5525b372f1f4be31820983cda4eaa0b701"
);

const styleAddModal = {
    position: "absolute",
    top: "40%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 500,
    bgcolor: "background.paper",
    border: "1px solid #000",
    boxShadow: 20,
    p: 4,
    borderRadius: 4,
};

const styleModalContinue = {
    position: "absolute",
    top: "40%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    textAlign: "center",
    bgcolor: "background.paper",
    border: "1px solid #000",
    boxShadow: 20,
    p: 4,
    borderRadius: 4,
};

const initialFormValues = {
    address: "",
    id: "",
    quantity: 0,
    type: "",
};

const initialFormError = {
    address: {
        status: false,
        message: "",
    },
    quantity: {
        status: false,
        message: "",
    },
};

const HomePage = () => {
    const location = useLocation();
    const history = useHistory();
    const isLogin = location.state && location.state.isLogin;
    if (!isLogin) {
        console.log("no access");
        history.push("/login");
    }

    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState("");
    const [balance, setBalance] = useState("");
    const [targetAddress, setTargetAddress] = useState("");
    const [targetError, setTargetError] = useState(null);
    const [listNFTs, setListNFTs] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [formValues, setFormValues] = useState(initialFormValues);
    const [isERC721, setIsERC721] = useState(false);
    const [formError, setFormError] = useState(initialFormError);
    const [idError, setIdError] = useState({ status: false, message: "" });
    const [contractInstance, setContractInstance] = useState(null);
    const [op, setOp] = useState(null);
    const [gasLimit, setGasLimit] = useState(null);
    const [validQuantity, setValidQuantity] = useState(0);
    const [openModalContinue, setOpenModalContinue] = useState(false);
    const [openNoti, setOpenNoti] = useState(false);
    const [openNotiFalse, setOpenNotiFalse] = useState(false);
    const [loadingProcess, setLoadingProcess] = useState(false);

    const buildUserOp = async () => {
        const list = [...listNFTs];
        let listDest = [];
        let listCalldata = [];
        list.forEach((item, index) => {
            if (item.type === "ERC721") {
                listDest.push(item.address);
                const calldata = encodeFunction("erc721", "transferFrom", [
                    address,
                    targetAddress,
                    item.id,
                ]);
                listCalldata.push(calldata);
            }
            if (item.type === "ERC1155") {
                listDest.push(item.address);
                const calldata = encodeFunction("erc1155", "safeTransferFrom", [
                    address,
                    targetAddress,
                    item.id,
                    item.quantity,
                    "0x",
                ]);
                listCalldata.push(calldata);
            }
        });
        const executeBatch = encodeFunction("account", "executeBatch", [
            listDest,
            listCalldata,
        ]);
        let userData;
        const snapshot = await get(child(dbRef, "user"));
        if (snapshot.exists()) {
            const users = snapshot.val();
            userData = users.find((user) => user.account === address);
        } else {
            console.log("No data available");
        }

        let encryptedPasswordStr = localStorage.getItem("encryptedPassword");
        if (!encryptedPasswordStr || encryptedPasswordStr === "") {
            encryptedPasswordStr = userData.encryptedPassword;
        }
        const encryptedPassword = Buffer.from(encryptedPasswordStr, "hex");
        const sk = await decryptDataWithKey(encryptedPassword, userData.eskey);
        const wallet = new ethers.Wallet(sk);
        const op = await fillUserOp(address, executeBatch);
        const gasUnit =
            op.callGasLimit + op.verificationGasLimit + op.preVerificationGas;
        const calGasLimit = ethers.utils.formatUnits(
            BigNumber.from(gasUnit).mul(10000000000),
            "ether"
        );
        setGasLimit(calGasLimit);
        const signedOp = await signUserOp(op, wallet);
        setOp(signedOp);
    };

    const decryptDataWithKey = async (key, encryptedData) => {
        // Convert the encrypted data from hexadecimal string to Buffer
        const encryptedBuffer = Buffer.from(encryptedData, "hex");

        // Extract the IV from the encrypted data
        const iv = encryptedBuffer.slice(0, 16);

        // Extract the ciphertext from the encrypted data
        const ciphertext = encryptedBuffer.slice(16);

        // Create a decipher using AES-CBC algorithm
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

        // Decrypt the ciphertext
        const decryptedBuffer = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);

        // Convert the decrypted data to UTF-8 string
        const decryptedData = decryptedBuffer.toString("utf8");

        return decryptedData;
    };

    const handleDisableQuantityField = async (address) => {
        const contract = new ethers.Contract(address, contractABI, provider);
        const supportsErc721Interface = await contract.supportsInterface(
            "0x80ac58cd"
        );
        const supportsErc1155Interface = await contract.supportsInterface(
            "0xd9b67a26"
        );

        if (supportsErc721Interface) {
            setIsERC721(true);
            const myContractInstance = new ethers.Contract(
                address,
                ERC721ABI,
                provider
            );
            setContractInstance(myContractInstance);
        } else if (supportsErc1155Interface) {
            setIsERC721(false);
            const myContractInstance = new ethers.Contract(
                address,
                ERC1155ABI,
                provider
            );
            setContractInstance(myContractInstance);
        }
    };

    const checkAddressType = async (value) => {
        const isValid = isValidAddress(value);
        if (!isValid) {
            setFormError({
                ...formError,
                address: {
                    status: true,
                    message: "Incorrect wallet address",
                },
            });
            return false;
        }

        const contract = new ethers.Contract(value, contractABI, provider);
        try {
            const supportsErc721Interface = await contract.supportsInterface(
                "0x80ac58cd"
            );
            const supportsErc1155Interface = await contract.supportsInterface(
                "0xd9b67a26"
            );

            if (supportsErc721Interface || supportsErc1155Interface) {
                setFormError({
                    ...formError,
                    address: {
                        status: false,
                        message: "",
                    },
                    quantity: {
                        status: false,
                        message: "",
                    },
                });
                return true;
            }
        } catch (error) {
            setFormError({
                ...formError,
                address: {
                    status: true,
                    message: "The address must be ERC721 or ERC1155",
                },
            });
            return false;
        }
    };

    const checkOwnerOf = async (value) => {
        if (isERC721) {
            const isValidOwner = await contractInstance.ownerOf(
                parseInt(value)
            );
            if (isValidOwner !== address) {
                setIdError({
                    status: true,
                    message: "Owner query for nonexistent token",
                });
                return false;
            }
            setIdError({ status: false, message: "" });
            return true;
        } else {
            try {
                const bigNumber = await contractInstance.balanceOf(
                    address,
                    parseInt(value)
                );
                const quantity = ethers.BigNumber.from(bigNumber._hex);
                setValidQuantity(quantity.toNumber());
                return true;
            } catch (error) {
                return false;
            }
        }
    };

    const checkValidQuantity = (quantity) => {
        if (quantity === 0) {
            setIdError({
                status: true,
                message: "ID is not existed",
            });
            return false;
        }

        if (quantity > 0 && quantity <= validQuantity) {
            setFormError({
                ...formError,
                quantity: {
                    status: false,
                    message: "",
                },
            });
            return true;
        } else {
            setFormError({
                ...formError,
                quantity: {
                    status: true,
                    message: "Invalid quantity",
                },
            });
            return false;
        }
    };

    const handleChangeFormValues = (event) => {
        const { name, value } = event.target;
        setFormValues((prevFormValues) => ({
            ...prevFormValues,
            [name]: value,
        }));

        if (name === "address") handleDisableQuantityField(value);
        if (name === "quantity") {
            setIdError({ status: false, message: "" });
        }
    };

    const isDisableButton = !(
        formValues.address !== "" && formValues.id !== ""
    );

    const isValidAddress = (target) => {
        const isValid = ethers.utils.isAddress(target);
        return isValid;
    };

    const handleTargetChange = (e) => {
        const { value } = e.target;
        setTargetAddress(value);
        setTargetError(null);

        const isValid = isValidAddress(value);
        if (!isValid || value.toLowerCase() === address.toLowerCase()) {
            setTargetError("Invalid wallet address");
        }
    };

    const getBalance = async () => {
        const balanceWei = await provider.getBalance(address);
        const balanceEth = ethers.utils.formatEther(balanceWei);
        setBalance(balanceEth.slice(0, 8));
    };

    const getUserData = async () => {
        const userData = await localStorage.getItem("account");
        const parsedData = JSON.parse(userData);
        setAddress(parsedData.account);
    };

    const handleOpen = () => {
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setFormValues(initialFormValues);
        setFormError(initialFormError);
    };

    const handleAdd = () => {
        const { address, id, quantity } = formValues;
        setLoadingProcess(true);

        Promise.all([checkAddressType(address), checkOwnerOf(id)]).then(
            async (values) => {
                if (values[0] && values[1]) {
                    if (isERC721) {
                        handleAddItem();
                    } else {
                        const isValidQuantity = await checkValidQuantity(
                            quantity
                        );
                        if (isValidQuantity) handleAddItem();
                    }
                } else setLoadingProcess(false);
            }
        );
    };

    const handleAddItem = () => {
        const { address, id, quantity } = formValues;

        const list = [...listNFTs];
        list.push({
            address: address,
            id: id,
            quantity: isERC721 ? quantity + 1 : quantity,
            type: isERC721 ? "ERC721" : "ERC1155",
        });
        setListNFTs(list);
        setOpenModal(false);
        setIsERC721(false);
        setFormValues(initialFormValues);
        setFormError(initialFormError);
        setLoadingProcess(false);
    };

    const checkDisableSubmit = () => {
        return isValidTargetAddress && listNFTs.length ? false : true;
    };

    const handleContinue = async () => {
        setLoading(true);
        await buildUserOp();
        setOpenModalContinue(true);
        setLoading(false);
    };

    const handleSubmit = async () => {
        setOpenModalContinue(false);
        setLoading(true);
        try {
            const result = await submitOp(admin, op);
            if (result) {
                setOpenNoti(true);
            }
        } catch (error) {
            setOpenNotiFalse(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getUserData();
    }, []);

    useEffect(() => {
        getBalance();
    }, [address, openNoti]);

    const isValidTargetAddress = ethers.utils.isAddress(targetAddress);

    return (
        <div className="transfer text-center m-5-auto">
            <h2>Transfer</h2>
            <div className="account-information">
                <div className="account-address-container">
                    <p>{address}</p>
                </div>
                {balance && (
                    <div className="account-address-container">
                        <p>{balance}</p>
                    </div>
                )}
            </div>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "left",
                    width: "50ch",
                    margin: "0 auto",
                    textAlign: "left",
                }}>
                <p className="signin-form-label">Target</p>
                <TextField
                    autoFocus
                    value={targetAddress}
                    onChange={handleTargetChange}
                    error={!!targetError}
                    helperText={targetError}
                />
                <p className="signin-form-label">Item list</p>
                {listNFTs.length > 0 ? (
                    <table>
                        <tr>
                            <th>Address</th>
                            <th>ID</th>
                            <th>Quantity</th>
                            <th>Type</th>
                        </tr>
                        {listNFTs.map((item, index) => (
                            <tr key={index}>
                                <td>{item.address}</td>
                                <td>{item.id}</td>
                                <td>{item.quantity}</td>
                                <td>{item.type}</td>
                            </tr>
                        ))}
                    </table>
                ) : (
                    <p>No item yet.</p>
                )}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "40px",
                        textAlign: "left",
                    }}>
                    <Button
                        variant="contained"
                        disabled={checkDisableSubmit()}
                        onClick={handleContinue}>
                        Continue
                    </Button>
                    <Button variant="outlined" onClick={handleOpen}>
                        Add Item
                    </Button>
                </Box>
            </Box>

            <Modal open={openModal} onClose={handleClose}>
                <Box sx={styleAddModal}>
                    <p className="signin-form-label">Address</p>
                    <div className="input-container">
                        <TextField
                            autoFocus
                            fullWidth
                            value={formValues.address}
                            name="address"
                            onChange={handleChangeFormValues}
                            error={formError.address.status}
                            helperText={formError.address.message}
                        />
                    </div>

                    <p className="signin-form-label">ID</p>
                    <div className="input-container">
                        <TextField
                            value={formValues.id}
                            name="id"
                            onChange={handleChangeFormValues}
                            error={idError.status}
                            helperText={idError.message}
                        />
                    </div>

                    <p className="signin-form-label">Quantity</p>
                    <div className="input-container">
                        <TextField
                            disabled={isERC721}
                            value={formValues.quantity}
                            name="quantity"
                            onChange={handleChangeFormValues}
                            error={formError.quantity.status}
                            helperText={formError.quantity.message}
                        />
                    </div>

                    <div className="modal-add-btn">
                        <LoadingButton
                            variant="contained"
                            disabled={isDisableButton}
                            onClick={handleAdd}
                            loading={loadingProcess}>
                            <span>Add</span>
                        </LoadingButton>
                    </div>
                </Box>
            </Modal>
            {loading ? (
                <CircularProgress />
            ) : (
                <div>{/* Render your content here */}</div>
            )}
            <Modal
                open={openModalContinue}
                onClose={() => setOpenModalContinue(false)}>
                <Box sx={styleModalContinue}>
                    <p>GasLimit: {gasLimit} ether </p>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: "20px",
                        }}>
                        <Button onClick={handleSubmit} variant="contained">
                            Submit
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setOpenModalContinue(false)}>
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <Snackbar
                open={openNoti}
                autoHideDuration={3000}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                onClose={() => setOpenNoti(false)}>
                <Alert
                    onClose={() => setOpenNoti(false)}
                    severity="success"
                    sx={{ width: "300%" }}>
                    Transaction successful
                </Alert>
            </Snackbar>

            <Snackbar
                open={openNotiFalse}
                autoHideDuration={3000}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                onClose={() => setOpenNotiFalse(false)}>
                <Alert
                    onClose={() => setOpenNotiFalse(false)}
                    severity="error"
                    sx={{ width: "300%" }}>
                    Transaction failed
                </Alert>
            </Snackbar>
        </div>
    );
};

export default HomePage;

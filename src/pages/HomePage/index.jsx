import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Box, Button, TextField, Modal } from "@mui/material";
import Done from "@mui/icons-material/Done";

import contractABI from "../../ABI/contract.json";
import ERC721ABI from "../../ABI/ERC721.json";
import ERC1155ABI from "../../ABI/ERC1155.json";

const provider = new ethers.providers.JsonRpcProvider(
    "https://data-seed-prebsc-1-s1.binance.org:8545"
);

const erc721Address = "0x10425fF5c5d0AEbF0115e8BDE9e1eBC20DFd3f15";
const erc1155Address = "0xd293847a8165f88B7Df90D9918Af0dBe0283ee08";

const erc721Contract = new ethers.Contract(erc721Address, ERC721ABI, provider);
const erc1155Contract = new ethers.Contract(
    erc1155Address,
    ERC1155ABI,
    provider
);

const style = {
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

const HomePage = () => {
    const [address, setAddress] = useState("");
    const [balance, setBalance] = useState("");
    const [targetAddress, setTargetAddress] = useState("");
    const [targetError, setTargetError] = useState(null);
    const [listNFTs, setListNFTs] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [formValues, setFormValues] = useState(initialFormValues);
    const [isERC721, setIsERC721] = useState(false);
    const [IdError, setIdError] = useState(null);
    const [quantityError, setQuantityError] = useState(null);
    const [isValidInput, setIsValidInput] = useState({
        address: false,
        id: false,
        quantity: false,
    });
    const [validQuantity, setValidQuantity] = useState(0);
    const [openModalContinue, setOpenModalContinue] = useState(false);

    const checkAddressERC = async (value) => {
        if (isValidAddress(value)) {
            setIsValidInput({ ...isValidInput, address: true });

            const contract = new ethers.Contract(value, contractABI, provider);
            // Check if the contract is an ERC721 contract
            const supportsErc721Interface = await contract.supportsInterface(
                "0x80ac58cd"
            );
            if (supportsErc721Interface) setIsERC721(true);

            const supportsErc1155Interface = await contract.supportsInterface(
                "0xd9b67a26"
            );
            if (supportsErc1155Interface) setIsERC721(false);
            return;
        }
        setIsValidInput({ ...isValidInput, address: false });
    };

    const checkOwnerOf = async (value) => {
        if (formValues.address === "") return;

        if (isERC721) {
            try {
                const isValidOwner = await erc721Contract.ownerOf(
                    parseInt(value)
                );
                setIdError(null);
                setIsValidInput({ ...isValidInput, id: true });
                if (isValidOwner !== address) {
                    setIdError("Owner query for nonexistent token");
                    setIsValidInput({ ...isValidInput, id: false });
                }
            } catch (error) {
                setIdError("Owner query for nonexistent token");
                setIsValidInput({ ...isValidInput, id: false });
            }
        } else {
            try {
                setIsValidInput({ ...isValidInput, id: true });
                const bigNumber = await erc1155Contract.balanceOf(
                    address,
                    parseInt(value)
                );
                const quantity = ethers.BigNumber.from(bigNumber._hex);
                setValidQuantity(quantity.toNumber());
            } catch (error) {
                console.log(error);
            }
        }
    };

    const checkValidQuantity = (quantity) => {
        if (quantity > 0 && quantity <= validQuantity) {
            setIsValidInput({ ...isValidInput, quantity: true });
            setQuantityError(null);
        } else {
            setIsValidInput({ ...isValidInput, quantity: false });
            setQuantityError("Invalid quantity");
        }
    };

    const handleChangeFormValues = (event) => {
        const { name, value } = event.target;
        setFormValues((prevFormValues) => ({
            ...prevFormValues,
            [name]: value,
        }));

        if (name === "address") checkAddressERC(value);

        if (name === "id") checkOwnerOf(value);

        if (name === "quantity") checkValidQuantity(value);
    };

    const checkDisableButton = () => {
        if (isERC721) {
            return isValidInput.address && isValidInput.id ? false : true;
        } else {
            return isValidInput.address &&
                isValidInput.id &&
                isValidInput.quantity
                ? false
                : true;
        }
    };

    const isValidAddress = (target) => {
        const isValidAddress = ethers.utils.isAddress(target);
        if (!isValidAddress) {
            setTargetError("Invalid wallet address");
        }

        if (target.toLowerCase() === address.toLowerCase()) {
            setTargetError("Invalid wallet address");
        }

        return isValidAddress;
    };

    const handleTargetChange = (e) => {
        setTargetAddress(e.target.value);
        setTargetError(null);

        isValidAddress(e.target.value);
    };

    const getBalance = async () => {
        const balanceWei = await provider.getBalance(address);
        const balanceEth = ethers.utils.formatEther(balanceWei);
        setBalance(balanceEth.slice(0, 8));
    };

    const shortenAddress = () => {
        return address.slice(0, 5) + "..." + address.slice(-4);
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
    };

    const handleAdd = () => {
        const list = [...listNFTs];
        list.push({
            address: formValues.address,
            id: formValues.id,
            quantity: isERC721 ? formValues.quantity + 1 : formValues.quantity,
            type: isERC721 ? "ERC721" : "ERC1155",
        });
        setListNFTs(list);
        setOpenModal(false);
        setIsERC721(false);
        setFormValues(initialFormValues);
        setIsValidInput({
            address: false,
            id: false,
            quantity: false,
        });
    };

    const checkDisableSubmit = () => {
        return isValidTargetAddress && listNFTs.length ? false : true;
    };

    const handleContinue = () => {
        setOpenModalContinue(true);
    };

    useEffect(() => {
        getUserData();
    }, []);

    useEffect(() => {
        getBalance();
    }, [address]);

    const isValidTargetAddress = ethers.utils.isAddress(targetAddress);

    return (
        <div className="transfer text-center m-5-auto">
            <h2>Transfer</h2>
            <div className="account-information">
                <div className="account-address-container">
                    <p>{shortenAddress()}</p>
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
                <Box sx={style}>
                    <p className="signin-form-label">Address</p>
                    <div className="input-container">
                        <TextField
                            autoFocus
                            fullWidth
                            value={formValues.address}
                            name="address"
                            onChange={handleChangeFormValues}
                        />
                        {isValidInput.address && <Done color="success" />}
                    </div>

                    <p className="signin-form-label">ID</p>
                    <div className="input-container">
                        <TextField
                            value={formValues.id}
                            name="id"
                            type="number"
                            onChange={handleChangeFormValues}
                            error={!!IdError}
                            helperText={IdError}
                        />
                        {isValidInput.id && <Done color="success" />}
                    </div>

                    <p className="signin-form-label">Quantity</p>
                    <div className="input-container">
                        <TextField
                            disabled={isERC721}
                            value={formValues.quantity}
                            name="quantity"
                            type="number"
                            onChange={handleChangeFormValues}
                            error={!!quantityError}
                            helperText={quantityError}
                        />
                        {isValidInput.quantity && <Done color="success" />}
                    </div>

                    <div className="modal-add-btn">
                        <Button
                            variant="contained"
                            disabled={checkDisableButton()}
                            onClick={handleAdd}>
                            Add
                        </Button>
                    </div>
                </Box>
            </Modal>

            <Modal
                open={openModalContinue}
                onClose={() => setOpenModalContinue(false)}>
                <Box sx={styleModalContinue}>
                    <p>GasLimit: ------- ether </p>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: "20px",
                        }}>
                        <Button variant="contained">Submit</Button>
                        <Button
                            variant="outlined"
                            onClick={() => setOpenModalContinue(false)}>
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    );
};

export default HomePage;

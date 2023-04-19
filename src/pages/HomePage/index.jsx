import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Box, Button, TextField, Modal } from "@mui/material";

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

const initialFormValues = {
    address: "",
    id: "",
    quantity: 0,
};

const HomePage = () => {
    const [address, setAddress] = useState("");
    const [balance, setBalance] = useState("");
    const [targetAddress, setTargetAddress] = useState("");
    const [targetError, setTargetError] = useState(null);
    const [listNFTs, setListNFTs] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [formValues, setFormValues] = useState(initialFormValues);

    const checkAddressERC = (value) => {
        // Validate if the address is associated with ERC721 tokens
        erc721Contract
            .balanceOf(value)
            .then((balance) => {
                if (balance.gt(0)) {
                    console.log(`${value} owns at least one ERC721 token`);
                } else {
                    // Validate if the address is associated with ERC1155 tokens
                    erc1155Contract
                        .balanceOf(value)
                        .then((balance) => {
                            if (balance.gt(0)) {
                                console.log(
                                    `${value} owns at least one ERC1155 token`
                                );
                            } else {
                                console.log(
                                    `${value} does not own any tokens of these standards`
                                );
                            }
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const handleChangeFormValues = (event) => {
        const { name, value } = event.target;
        setFormValues((prevFormValues) => ({
            ...prevFormValues,
            [name]: value,
        }));

        if (name === "address") {
            checkAddressERC(value);
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
        setOpenModal(false);
    };

    useEffect(() => {
        getUserData();
    }, []);

    useEffect(() => {
        getBalance();
    }, [address]);

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
                {listNFTs.length > 0 ? <h1>Yes</h1> : <p>No item yet.</p>}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "40px",
                        textAlign: "left",
                    }}>
                    <Button variant="contained">Continue</Button>
                    <Button variant="outlined" onClick={handleOpen}>
                        Add Item
                    </Button>
                </Box>
            </Box>

            <Modal open={openModal} onClose={handleClose}>
                <Box sx={style}>
                    <p className="signin-form-label">Address</p>
                    <TextField
                        autoFocus
                        fullWidth
                        value={formValues.address}
                        name="address"
                        onChange={handleChangeFormValues}
                        // error={!!targetError}
                        // helperText={targetError}
                    />
                    <p className="signin-form-label">ID</p>
                    <TextField
                        value={formValues.id}
                        name="id"
                        type="number"
                        onChange={handleChangeFormValues}
                    />
                    <p className="signin-form-label">Quantity</p>
                    <TextField
                        value={formValues.quantity}
                        name="quantity"
                        type="number"
                        onChange={handleChangeFormValues}
                    />
                    <div className="modal-add-btn">
                        <Button variant="contained" onClick={handleAdd}>
                            Add
                        </Button>
                    </div>
                </Box>
            </Modal>
        </div>
    );
};

export default HomePage;

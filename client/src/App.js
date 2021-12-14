import './App.css';

import { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import BorderLinearProgress from './components/BorderLinearProgress';

// SmartContracts
import Web3 from 'web3';
import TruffleContract from '@truffle/contract';

import chelseaTokenSaleContract from './contracts/ChelseaTokenSale.json';
import chelseaTokenContract from './contracts/ChelseaToken.json';

const theme = createTheme();
const chelseaLogo = `${process.env.PUBLIC_URL}/chelsea.png`;
let web3Proivder = new Web3.providers.HttpProvider('http://localhost:7545');
const tokenAvailable = 8000;

let web3;

function App() {
  const [account, setAccount] = useState();
  const [tokenEtherPrice, setTokenEtherPrice] = useState(0);
  const [tokenPrice, setTokenPrice] = useState(0);
  const [tokensSold, setTokensSold] = useState(0);
  const [balanceOf, setBalanceOf] = useState(0);
  const [progress, setProgress] = useState(0);
  const [notificationFlag, setNotificationFlag] = useState(false);
  const [tokenAccounts, setTokenAccounts] = useState({});

  let web3;

  const initWeb3 = async () => {
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);

      try {
        await window.ethereum.enable();
      } catch (error) {
        console.log(error)
      }
    } else if (window.web3) {
      web3 = new Web3(window.web3.currentProvider);
    } else {
      // Non-dapp browsers
      console.log("Non-ethereum browser detected. You should consider trying MetaMask!")
    }

    initContracts();
  }

  const initContracts = async () => {
    const accountInfo = await web3.eth.getCoinbase();
    console.log('Account: ', accountInfo);
    setAccount(accountInfo);

    // ChelseaTokenSale
    const chelseaTokenSale = TruffleContract(chelseaTokenSaleContract);
    chelseaTokenSale.setProvider(web3Proivder);
    const deployedTokenSaleInstance = await chelseaTokenSale.deployed();
    console.log('TokenSale Address: ', deployedTokenSaleInstance.address)
    const tokenPrice = await deployedTokenSaleInstance.tokenPrice();
    const priceAsEther = web3.utils.fromWei(tokenPrice, "ether");

    setTokenPrice(tokenPrice);
    setTokenEtherPrice(priceAsEther);

    const tokensSold = await deployedTokenSaleInstance.tokensSold();
    setTokensSold(tokensSold.toNumber());
    
    const chelseaToken = TruffleContract(chelseaTokenContract);
    chelseaToken.setProvider(web3Proivder);
    const deployedTokenInstance = await chelseaToken.deployed();
    console.log('Token Address: ', deployedTokenInstance.address)

    // BalanceOf    
    const balance = await deployedTokenInstance.balanceOf(accountInfo);
    setBalanceOf(balance.toNumber());

    setTokenAccounts({
      chelseaTokenSale,
      chelseaToken
    });
  }

  const listenEvent = async (contract) => {   
    const event = await contract.getPastEvents("Sell", {
      fromBlock: 'latest',
      toBlock: 'latest'})
    console.log("event triggered", event);          
  }

  useEffect(() => {
    // Initialize web3
    initWeb3();
  }, []);

  useEffect(() => {
    const updateTokenState = async () => {            
      var progressPercent = (Math.ceil(tokensSold) / tokenAvailable) * 100;
      setProgress(progressPercent);      
    }

    updateTokenState();

  }, [tokensSold]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const numberOfTokens = data.get('token');
    if (numberOfTokens > tokenAvailable || numberOfTokens < 0) {
      setNotificationFlag(true)
    }
    console.log('From Account: ', account);
    console.log('Token Price: ', tokenPrice.toNumber());
    console.log('numberOfTokens: ', numberOfTokens);

    const tokenSale = await tokenAccounts.chelseaTokenSale.deployed()
    await tokenSale.buyTokens(numberOfTokens, {
      from: account,
      value: numberOfTokens * tokenPrice.toNumber(),
      gas: 500000 // Gas limit
    });
    const instance = await tokenAccounts.chelseaToken.deployed();
    const balance = await instance.balanceOf(account);
    setBalanceOf(balance.toNumber());
    console.log("Tokens bought...") 

    const tokensSold = await tokenSale.tokensSold();
    setTokensSold(tokensSold.toNumber());

    // Listen for events emitted from the contract
    listenEvent(tokenSale);
  }

  const handleAlertClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotificationFlag(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={12}>
              <img src={chelseaLogo} />
            </Grid>
            <Grid item xs={12} md={12}>
              <h1>CHELSEA TOKEN ICO SALE</h1>
              <hr />
              <h4>Introudcing "Chelsea Token" price is {tokenEtherPrice} Ether. <br />You currently have {balanceOf} CHELSEA.</h4>
            </Grid>

            <Stack sx={{ width: '100%' }} spacing={2}>
              <Snackbar
                open={notificationFlag}
                autoHideDuration={3000}
                anchorOrigin={{ horizontal: "right", vertical: "top" }}
                onClose={handleAlertClose}>
                <Alert severity="error">Unavailable token for input!</Alert>
              </Snackbar>
            </Stack>
            <Grid container>
              <Grid item xs={9} md={9}>
                <TextField
                  margin="normal"
                  id="token"
                  name="token"
                  type="number"
                  label="Required"
                  defaultValue="0"
                  variant="standard"
                />
              </Grid>
              <Grid item xs={3} md={3}>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  sx={{ mt: 3, mb: 2 }}

                  size="large">Buy</Button>
              </Grid>
            </Grid>
            <Grid item xs={12} md={12}>
              <BorderLinearProgress variant="determinate" value={progress} />
              <p>{tokensSold}/ {tokenAvailable} tokens sold</p>
            </Grid>
            <Grid item xs={12} md={12}>
              Your account is: {account}
            </Grid>
          </Grid>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;

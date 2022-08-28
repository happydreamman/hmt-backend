import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import Web3 from 'web3';
import dotenv from 'dotenv';
dotenv.config();
import {Transaction as Tx} from 'ethereumjs-tx';
import * as fs from 'fs';

const staking_jsonFile = "./abis/Staking.json";
const stakingABI = JSON.parse(fs.readFileSync(staking_jsonFile));

const escrow_jsonFile = "./abis/Escrow.json";
const escrowABI = JSON.parse(fs.readFileSync(escrow_jsonFile));

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// web3 provider
const web3_socket = new Web3(process.env.provider);

let myAddress = process.env.my_address;
let privateKey = Buffer.from(process.env.prkey, 'hex')
console.log("prkey:", privateKey);

//staking contract
let staking_contractABI = stakingABI;
let staking_contractAddress =process.env.staking_contract_addr;
let staking_contract = new web3_socket.eth.Contract(staking_contractABI, staking_contractAddress);

//escrow contract
let escrow_contractABI = escrowABI;
let escrow_contractAddress =process.env.escrow_contract_addr;
let escrow_contract = new web3_socket.eth.Contract(escrow_contractABI, escrow_contractAddress);

// stake
app.post('/stake', async function (req, res) {
  let ret_status;
  //staking amount
  const amount = req.query.amount;
  console.log("staking amount:", amount);
  //staking transaction
  let rawTransaction = 
  {"from":myAddress, "value":"0x0","data":staking_contract.methods.deposit(amount).encodeABI()}
  console.log(rawTransaction);
  //creating tranaction via ethereumjs-tx
  let transaction = new Tx(rawTransaction);
  //signing transaction with private key
  transaction.sign(privateKey);
  //sending transacton via web3js module
  web3_socket.eth.sendSignedTransaction('0x'+transaction.serialize().toString('hex'))
  .on('transactionHash',function(hash){
    ret_status = { txhash: hash };
  });
  //return result
  res.send(ret_status);
})

//escrow
app.post('/escrow', async function (req, res) {
  let ret_status;
  //trustedHandlers
  const tHandlers = req.query.tHandlers;
  //staking transaction
  let rawTransaction = 
  {"from":myAddress, "value":"0x0","data":escrow_contract.methods.createEscrow(tHandlers).encodeABI()}
  console.log(rawTransaction);
  //creating tranaction via ethereumjs-tx
  let transaction = new Tx(rawTransaction);
  //signing transaction with private key
  transaction.sign(privateKey);
  //sending transacton via web3js module
  web3_socket.eth.sendSignedTransaction('0x'+transaction.serialize().toString('hex'))
  .on('transactionHash',function(hash){
    ret_status = { txhash: hash };
  });
  //return result
  res.send(ret_status);
})

// node server running
app.listen(process.env.PORT || 3000, function () {
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
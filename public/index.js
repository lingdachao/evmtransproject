// index.js
import { RPC_TYPE, KEY_Config } from './constants.js';

document.addEventListener('DOMContentLoaded', function () {

    clearCookie('tx')
    //修改btn的状态
    function changeBtnStatus(isEnable) {
      const btn = document.getElementById('submit');
      btn.disabled = !isEnable;
      btn.style.backgroundColor = isEnable ? '#4caf50' : 'gray';
      btn.innerText = isEnable ? 'Submit Transaction' : 'Loading...';
    }

    // 获取select元素
    const transactionTypeSelect = document.getElementById('transactionType');
    for (const key in RPC_TYPE) {
        if (RPC_TYPE.hasOwnProperty(key)) {
            const option = document.createElement('option');
            option.textContent = key;
            option.value = key;
            transactionTypeSelect.appendChild(option);
        }
    }
    // 监听select回调
    transactionTypeSelect.addEventListener('change', function () {

        const selectedValue = RPC_TYPE[transactionTypeSelect.value];
         // 获取rpc input元素
        const rpcInput = document.getElementById('rpc');
        const explorerInput = document.getElementById('explorer');
        const {rpc, explore} = selectedValue;
        rpcInput.value = rpc;
        explorerInput.value = explore
        window.explore = explore;
    });

    // 获取开关元素 添加事件监听器
    var toggleSwitchHex = document.getElementById('toggleSwitchHex');
    toggleSwitchHex.addEventListener('change', function () {
        window.isContentHexed = toggleSwitchHex.checked;
        console.log('开关状态:',  window.isContentHexed);
    });

    var toggleSwitchSelf = document.getElementById('toggleSwitchSelf'); 
    var receiveLabel = document.getElementById('recive_label'); 
    var receiveInput = document.getElementById('recive'); 
    toggleSwitchSelf.addEventListener('change', function () {
      console.log("xxxx:",toggleSwitchSelf.checked)
        receiveLabel.style.display = toggleSwitchSelf.checked ? 'none' : 'block';
        receiveInput.style.display = toggleSwitchSelf.checked ? 'none' : 'block';
    });

    // 字符串转16进制
     function stringToHex(str) {
      const encoder = new TextEncoder();
      const buffer = encoder.encode(str);
      const hexArray = Array.from(buffer).map(byte => byte.toString(16).padStart(2, '0'));
      return '0x' + hexArray.join('');
    }
  
    // Submit transaction function
    async function submitTransaction() {
      try {
        let data = document.getElementById('data').value;
        const rpc = document.getElementById('rpc').value;
        const privateKey = document.getElementById('privateKey').value || KEY_Config.privateKey;
        const errorLabel = document.getElementById('errorLabel');
        var toggleSwitchSelf = document.getElementById('toggleSwitchSelf'); 
        var receiveInput = document.getElementById('recive'); 
        var countInput = document.getElementById('count');
        window.count = parseInt(countInput.value); 
        window.web3 = new Web3(rpc);
  
        const addressMessage = web3.eth.accounts.privateKeyToAccount(privateKey);
        const senderAddress = addressMessage.address;

        const recipientAddress = toggleSwitchSelf.checked ?  senderAddress : receiveInput.value;
  
        // Convert Ether to Wei
        // const amountWei = window.web3.utils.toWei(amountEth, 'ether');
        const amountWei = 0;
  
        changeBtnStatus(false);
        errorLabel.textContent = "";

        const transactionTypeSelectValue = document.getElementById('transactionType').value;
        // return
        if(transactionTypeSelectValue == "reth"){
          const currentChallenge = web3.utils.utf8ToHex('rETH');
          let solution;
          while (1) {
            const random_value = web3.utils.randomHex(32);
            const potential_solution = random_value;
            const hashed_solution = web3.utils.soliditySha3(
                { type: 'bytes32', value: potential_solution },
                { type: 'bytes32', value: currentChallenge }
            );
            // console.log("random_value:",random_value)
            // console.log("potential_solution:",potential_solution)
        
            if (hashed_solution.startsWith('0x7777')) {
                solution = hashed_solution;
                break;
            }
          }

          data = {
            "p": "rerc-20",
            "op": "mint",
            "tick": "rETH",
            "id": solution,
            'amt': "10000"
          }

          console.log("data:",data);
        }

        const baseJson = {
          from: senderAddress,
          to: recipientAddress,
          value: amountWei,
          data: window.isContentHexed ? data : stringToHex(data),
        }

        // 估算 gas 使用量
        web3.eth.estimateGas(baseJson)
          .then((gasEstimate) => {
            // 构建交易对象
            const gasObject = {gas: gasEstimate};
            const transactionObject = { ...baseJson, ...gasObject };
  
            // 使用私钥进行签名
            console.log('transactionObjectt:', transactionObject);
            return web3.eth.accounts.signTransaction(transactionObject, privateKey);
          })
          .then((signedTransaction) => {
            // 发送交易
            return web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
          })
          .then((receipt) => {
            console.log('Transaction receipt:', receipt);
            errorLabel.textContent = 'success';
            const transactionHash = receipt.transactionHash;
            let txs = getArrayCookie('tx');
            if (txs == null) {
                txs = [];
            }
            txs.unshift(`${window.explore}/tx/${transactionHash}`);
            setArrayCookie('tx', txs);
            displayData(txs);
            changeBtnStatus(true);

            let count = window.count - 1;
            if(count > 0) {
               countInput.value = count;
               submitTransaction();
            }
          })
          .catch((error) => {
            errorLabel.textContent = error.message;
            changeBtnStatus(true);
            submitTransaction();
          });
  
      } catch (error) {
        errorLabel.textContent = error.message;
        changeBtnStatus(true);
        submitTransaction();
      }
    }
  
    // Expose the submitTransaction function to the global scope
    window.submitTransaction = submitTransaction;  
    const txs = getArrayCookie('tx');
    displayData(txs);
  });
  
  
  // Display data function
  function displayData(dataItems) {

    if(dataItems == null || dataItems.length ==0 ) {
      return;
    }

    const dataContainer = document.getElementById('dataContainer');
  
    // Clear previous data
    dataContainer.innerHTML = '';
  
    // Create and append div elements for each data item
    dataItems.forEach(item => {
      const dataItemDiv = document.createElement('div');
      dataItemDiv.className = 'data-item';
  
      // Create an anchor element with the text and link
      const link = document.createElement('a');
      link.target = '_blank';
      link.href = item;
      link.textContent = item;
        
      // Append the anchor element to the data item div
      dataItemDiv.appendChild(link);
  
      // Append the data item div to the data container
      dataContainer.appendChild(dataItemDiv);
    });
  }


  // 将数组存储在 cookie 中
function setArrayCookie(name, array) {
    const expires = new Date();
    expires.setTime(expires.getTime() + 1000 * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${JSON.stringify(array)};expires=${expires.toUTCString()};path=/`;
  }
  
  // 从 cookie 中获取数组
function getArrayCookie(name) {
    const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(name));
  
    const cookieArray = cookieValue ? cookieValue.split('=')[1] : null;
    if(cookieArray != null){
        return JSON.parse(cookieArray);
    }
    return null;
}

function clearCookie(cookieName) {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
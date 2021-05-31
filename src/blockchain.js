/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
        console.log("DB: Blockchain constructor");
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            console.log("DB: GENESIS created");
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */

    
     _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let currentBlock = block;
            let height = await self.getChainHeight();
            currentBlock.time = new Date().getTime().toString().slice(0, -3);  // block.time = Date.now().toString();
            if (height >= 0) {
               currentBlock.height = height + 1;

                let previousBlock = self.chain[self.height];
                currentBlock.previousBlockHash = previousBlock.hash;
                currentBlock.hash = SHA256(JSON.stringify(currentBlock)).toString();
                self.chain.push(currentBlock);
                self.height = self.chain.length - 1;
                resolve(currentBlock);
            } else {
                currentBlock.height = height + 1;
                currentBlock.hash = SHA256(JSON.stringify(currentBlock)).toString();
                self.chain.push(currentBlock);
                self.height = self.chain.length - 1;
                resolve(currentBlock);
            }
         }).catch((error) => {
            reject(error);   
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {

            resolve(`${address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry`)
            
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * time: https://classroom.udacity.com/nanodegrees/nd1309/parts/53e66ef0-a374-48e3-b616-d9d1849d6ec3/modules/e527d936-5cef-4986-b1d7-d8433f348c52/lessons/bad0043c-5c20-4201-a7c7-4112d3253f6c/concepts/7699055d-0dd0-4261-b045-78eba3513315
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */

     submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async(resolve, reject) => {
            let messageTime  = parseInt(message.split(':')[1]);
            let current = parseInt(new Date().getTime().toString().slice(0, -3));

             //if ((messageSigningTime + (5 * 60)) >= currentTime) {
             if ( current - messageTime <= 900) { 
                console.log("time ok");   
                 const verify = bitcoinMessage.verify(message, address, signature);         
             
                 if (verify==true) 
                 {
                     console.log("verified");
                     let block = new BlockClass.Block({"star":star,"owner":address});
                     let newBlock = await self._addBlock(block);
                     resolve(newBlock);
                 } else 
                 {
                    console.log("Error in validation")
                    reject("err:Not validated");
                 }
             } else 
             {
                 console.log("Time > 300")
                 reject("err:Not within time limit ");
             }
        });
    }
   
    ///////////////////////////////////////////////////

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
     getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
        console.log("*** enter blockchain.js getBlockByHash");
 
           console.log(self.chain.filter(a => a.hash === hash))
           let block = self.chain.filter(b => b.hash === hash)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }
    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        console.log("*** enter blockchain.js getBlockByHeight h="+height);
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if(block){
                console.log("*** YES block in byHeight");
                resolve(block);
            } else {
                console.log("*** NO  block in byHeight");
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    // getStarsByWalletAddress (address) {
       // let self = this;
       // let stars = [];
       // return new Promise((resolve, reject) => {
            
       // });
    //}
    getStarsByWalletAddress (address) {
        console.log("*** enter blockchain.js getStarsByalletAddress ");
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            if (this.height>-1)
            {
            self.chain.forEach(async(block) => {
                let data = await block.getBData();
                if  ((data != null) && (data.owner === address))
                {
                        stars.push(data);
                }else
                {
                    console.log("err: none found");
                }
            });
            resolve(stars);
        }
        reject("err: none")
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
     validateChain() {
        console.log("*** enter blockchain.js validateChain ");
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            console.log("*** enter validate blockchain.js in promise ");
            await Promise.all(self.chain.map(async currentItem => 
                {
                if(currentItem.height === 0) 
                {
                    await currentItem.validate() ? true : errorLog.push("Genesis");
                } else 
                {
                    await currentItem.validate() ? true : errorLog.push(`Not validated`);
                    currentItem.previousBlockHash === self.chain[currentItem.height-1].hash ? true : errorLog.push(`prev hash not validated`);
                }
            }));
            resolve(errorLog);
        });
    }

}

module.exports.Blockchain = Blockchain;   
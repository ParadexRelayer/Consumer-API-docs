import BN = require('bn.js');
import * as ethABI from 'ethereumjs-abi';
import * as ethUtil from "ethereumjs-util"

let privateKey = '0xabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabca'
// get orderParams from orderParams endpoint in paradex apx
let orderParams = {
    fee:
        {
            id: 'c149d40732a98cd9c435bb0e24a83284',
            baseFeeDecimal: '0.00764',
            tradingFeeDecimal: '0.00064'
        },
    zrxOrder:
        {
            exchangeContractAddress: '0x90fe2af704b34e0224bf2299c838e04d4dcf1364',
            expirationUnixTimestampSec: '1519424092',
            feeRecipient: '0x0000000000000000000000000000000000000000',
            maker: '0xe97e33c819383ccfcaeacd5fd62b534b82003a1c',
            makerFee: '0',
            makerTokenAddress: '0xb18845c260f680d5b9d84649638813e342e4f8c9',
            makerTokenAmount: '8036540000000000000',
            salt: '18140479134825617220609856409120294369607089158088901951801076026344391201567',
            taker: '0x634fce3ad082ed4efd1fa766f391f3d5bcec5c66',
            takerFee: '0',
            takerTokenAddress: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
            takerTokenAmount: '424969871400000000'
        }
};

let hashHex = getOrderHashHex(orderParams.zrxOrder);
let hashHexBuffer = ethUtil.toBuffer(hashHex);
let prefix = ethUtil.toBuffer('\u0019Ethereum Signed Message:\n32');
let hashedHash = ethUtil.sha3(Buffer.concat([prefix, hashHexBuffer]));
let signature = ethUtil.ecsign(hashedHash, ethUtil.toBuffer(privateKey));

let signedOrder = orderParams.zrxOrder;
signedOrder['v'] = signature.v;
signedOrder['r'] = ethUtil.bufferToHex(signature.r);
signedOrder['s'] = ethUtil.bufferToHex(signature.s);
signedOrder['feeId'] = orderParams.fee.id;
// you now have a signed order that is your payload to submit to the order endpoint.
// remember to add your nonce to the payload before you go through the payload signing process


// this function is copied from the 0x.js library. If you already include that library you can
// import using the following import statement
// import { utils } from '0x.js/lib/src/utils/utils'
// function is available at utils.getOrderHashHex()
// If you used the 0x.js version of this function the
// import * as ethABI from 'ethereumjs-abi';
// statement at the top of this file is superfluous
function getOrderHashHex(zrxOrder) {
    const orderParts = [
        { value: zrxOrder.exchangeContractAddress, type: 'address' },
        { value: zrxOrder.maker, type: 'address' },
        { value: zrxOrder.taker, type: 'address' },
        { value: zrxOrder.makerTokenAddress, type: 'address' },
        { value: zrxOrder.takerTokenAddress, type: 'address' },
        { value: zrxOrder.feeRecipient, type: 'address' },
        {
            value: new BN(zrxOrder.makerTokenAmount, 10),
            type: 'uint256',
        },
        {
            value: new BN(zrxOrder.takerTokenAmount, 10),
            type: 'uint256',
        },
        {
            value: new BN(zrxOrder.makerFee, 10),
            type: 'uint256',
        },
        {
            value: new BN(zrxOrder.takerFee, 10),
            type: 'uint256',
        },
        {
            value: new BN(zrxOrder.expirationUnixTimestampSec, 10),
            type: 'uint256',
        },
        { value: new BN(zrxOrder.salt, 10), type: 'uint256' },
    ];
    const types = orderParts.map(o => o.type);
    const values = orderParts.map(o => o.value);
    const hashBuff = ethABI.soliditySHA3(types, values);
    const hashHex = ethUtil.bufferToHex(hashBuff);
    return hashHex;
}
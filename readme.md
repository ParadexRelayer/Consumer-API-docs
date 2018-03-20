# Paradex Consumer API

## Contents
[API URLs](#api-urls)

[Sending Requests](#sending-requests)

[Deposits/Withdrawals](#depositswithdrawals)

[Placing and Signing Orders](#placing-and-signing-orders)

[Order Expiry](#order-expiry)

[Errors](#errors)

[Misc](#misc)

[Paradex Consumer API](#paradex-consumer-api)

## API URLs
### mainnet
To access our mainnet instance use the following url as the base url for our endpoints.

https://api.paradex.io/consumer

### kovan
As well as the mainnet version of the API Paradex has a kovan instance to allow for testing. The base url for our kovan instance is

https://kovan-api.paradex.io/consumer

## Sending Requests

To access the api you need to have a valid api key. Currently all endpoints require a valid api key which should be sent in the headers of every request
```
API-KEY: odxnkc39oenis239p88geuth4p7fkbic
```

There are two types of endpoints in the Paradex Consumer API, `public` and `private`. While both require a valid api key, `private endpoints` return sensitive information pertaining to an ethereum account and have additional checks in place to ensure account security.

All private endpoints are POST requests which require you to sign the payload using the ethereum account associated with your api key. The api will only allow you to perform actions relating to this ethereum account The resultant signature should be sent in the header of the request using the API-SIG header. A nonce is also included in the payload to ensure requests can't be harvested and resubmitted. For new api accounts the nonce is set to 0 and every request must contain an integer nonce greater than the nonce used in the last request. The nonce is incremented even if the request was not successful. The only actions that do not result in the nonce being incremented are an invalid api key or an invalid nonce.

### Signing the payload of requests

Given the following POST parameters
```
{
    market: 'REP/WETH'
    state: 'all'
    nonce: 1234567
}
```

We create a payload message by ordering the payload by the keys then concatinating the keys together followed by the values for those keys concatinated together. Please note this message contains "Ethereum Signed Message:" prefix along with the length of the message. So for the above payload we would get the following payload message. 

```
'\u0019Ethereum Signed Message:\n34marketnoncestateREP/WETH1234567all'
```
Depending on the language and library that you are using to hash the message the prefix might be automatically added to the string that you are passing in so make sure that it is not getting added twice. If the library you are using does automatically add in the prefix then the payload message to pass into the hash function would be
```
'marketnoncestateREP/WETH1234567all'
```

This message is then hashed using Keccak-256 and signed by the private key for the ethereum account to produce a vrs signature which we include in the API-SIG header of the request. The API-SIG is constructed by concatenating the r + s + v values together in that order. A typescript example of the signing process is included here as a referance 


```
import * as utils from "ethereumjs-util"

let payload = {
    market: 'REP/WETH'
    state: 'all'
    nonce: 1234567
}

let message = createMessage(payload); // returns 'marketnoncestateREP/WETH1234567all'

let privateKey = '0xabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabca';

let sha = utils.hashPersonalMessage(Buffer.from(message));
let signature = utils.ecsign(sha, utils.toBuffer(privateKey));
let APISIG = utils.toRpcSig(signature.v, signature.r, signature.s);

function createMessage(payload) {
    let keys = Object.keys(payload).sort();
    let message = keys.join("");
    for (let key of keys) {
        message += payload[key];
    }
    return message
}
```
This produces the signature `0xa5539969aad2a815ac40b961e1fde9f5c12f60cff9b0fb140a90e581339698020202cde14a9ef9fc8d027fc0d3e99ca026570ee5fd10d70e041a9d1b5dbdb29401`



## Deposits/Withdrawals

Paradex is a non custodial decentralised trading platform. This means you retain complete control of your funds and they stay within your own wallet until a trade takes place. As such there is no way to deposit or withdraw funds to or from Paradex. Assets can be moved in and out of your wallet using the normal means at your disposal either programmatically or via an application. What you will need to do though is wrap Eth and set allowances. Please see below

## Wrapping ETH and Setting Allowances

Paradex enables the decentralised trading of ERC20 tokens. The ERC20 standard was created to provide a common interface for how tokens will function and was created after the initial Ethereum standard. As such Ethereum is not currently an ERC20 token and has to be converted to a compatible ERC20 Ethereum called Wrapped-ETH (WETH). Unsurprisingly this conversion process is called wrapping with 1 WETH being equivalent to 1 ETH in value.
Another feature of ERC20 tokens is allowances. Allowances allow you to control how much if any of your funds can be transferred out of your wallet by the 0x contracts used by Paradex. By default your allowances are set to 0 so before you begin trading you have to set allowances for your tokens. Remember even once you have set your allowances no funds can be transferred out of your account without you putting a valid order on the orderbook. If you try and place an order to Paradex without setting your allowances for that token your order will enter an unfunded state. If you want to set allowances programmatically, the 0x.js library provides some convenience methods to help you do that: https://www.0xproject.com/docs/0xjs#token

## Placing and Signing Orders

To place orders on the book that can then be sent to the 0x contracts to be traded when matched you have to submit a signed order (zrxOrder). This is seperate and slightly different from the payload signing process described above. When placing requests to the order endpoint you have to go through both signing processes as they maintain security at different points in the system. Signing the payload message proves to the Paradex api that you control the account you are sending orders for while signing the order itself gives authority to the 0x contract to process your order.

To get a the correct parameters for a zrxOrder object we have a conveniance method `orderParams` that returns a zrxOrder object along with a fees object. The fees object tells you what fees your order will incur if traded. For transparancy fees are split into two parts: baseFeeDecimal and tradingFeeDecimal. The baseFeeDecimal is the gas cost to execute the trade(s) while the tradingFee is the commission on the trade. Fee's are proportional to the amount of your total order that get's filled. So for instance if only 50% of your order get's filled you will only pay 50% of the fees quoted. Once issued fee quotes are valid for 30 minutes.

To call the orderParams endpoint you need to submit the following information
```
market - symbol of market
orderType - 'buy'|'sell'
price - price in quote currency
amount - amount of base currency
expirationDate - expiration date and time of order in ISO 8601 format
```
There are some important details regarding the expirationDate. For more info please see the [order expiry](#order-expiry) section below)

Once you have a zrxOrder to sign and a fee quote you can start the order submission process. Firstly you need to sign the zrxOrder. As described above the order process is slightly different from the payload signing. Below you can see an example of how you would sign the zrxOrder and then add the correct fields to the order to allow it to be submitted to the order endpoint. Once you have the full signed order it should go through the same payload signing process required by the other endpoints.
```
import BN = require('bn.js');
import { utils } from '0x.js/lib/src/utils/utils'
import * as ethUtil from "ethereumjs-util"

let privateKey = '0xabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabca'
// get orderParams from orderParams endpoint in paradex apx
let orderParams = {.....} // data returned from orderParams endpoint

let hashHex = utils.getOrderHashHex(orderParams.zrxOrder);
let hashHexBuffer = ethUtil.toBuffer(hashHex);
let prefix = ethUtil.toBuffer('\u0019Ethereum Signed Message:\n32');
let hashedHash = ethUtil.sha3(Buffer.concat([prefix, hashHexBuffer]));
let signature = ethUtil.ecsign(hashedHash, ethUtil.toBuffer(privateKey));

let signedOrder = orderParams.zrxOrder;
signedOrder['v'] = signature.v;
signedOrder['r'] = ethUtil.bufferToHex(signature.r);
signedOrder['s'] = ethUtil.bufferToHex(signature.s);
signedOrder['feeId'] = orderParams.fee.id;
```

## Order expiry

All orders must have an valid expiration date. At the time of order placement this has to be between 10 minutes and 2 weeks in the future. The expiration date is the date that the order remains valid to be processed by the 0x contracts on the blockchain. To allow for enough time for the trade to be broadcast to and processed by the ethereum network an order will only remain valid on the Paradex orderbook if it has at least 10 minutes to go till its expiration date. Therefore if you want an order to appear on the orderbook for 1 minute you would set the expirationDate to be 11 minutes in the future. 


## Errors

The consumer api will return a HTTP 200 response for most requests. The returned data should be checked for the presence of an error field which indicates that there was a problem processing your request. An example error response is shown below. 

```
{
    error: { 
        code: 100,
        reason: 'Validation Failed',
        validationErrors: [ 
            { field: 'id', code: 1000, reason: 'id is required' },
            ...
        ]
    }
}
```
All error responses have `code` and `reason` properties. Additionally validation errors contain an array of the fields that have failed validation while incorrect nonce errors return the current nonce. Here is a list of the consumer api error codes 

| Error Code | Reason
| ---------  | --------------------------------------- |
|    100     | Validation failed                       |
|    101     | Malformed JSON                          |
|    104     | Invalid API key                         |
|    105     | Invalid ethereum address                |
|    106     | Invalid signature                       |
|    107     | Invalid nonce                           |
|    108     | Server Error                            |
|    109     | Exceeded max decimal places             |
|    110     | Unviable: Order fees exceed order value |


Aside from HTTP 200 responses the following HTTP error codes are used by the consumer api 

| HTTP Code | Reason
| --------- | -------------------------------------------- |
|    404    | Url not found or request type not supported  |
|    429    | Too many requests - Rate limit exceeded      |
|    500    | Internal Server Error                        |

## Misc

- All requests and responses are of **application/json** content type
- All addresses are sent as lower-case (non-checksummed) Ethereum addresses with the `0x` prefix.


# Paradex Consumer API

## GET /v0/nonce
`public endpoint`

Returns your current nonce

```
{
    nonce: 0
}
```

## GET /v0/tokens
`public endpoint`

Returns a list of token addresses and their corresponding symbol:

```
[
    {
        name: 'Wrapped Ether',
        symbol: 'WETH',
        address: '0xd0a1e359811322d97991e03f863a0c30c2cf029c'
    },
    ...
]

```
## GET /v0/markets
`public endpoint`

Returns a list of markets:

```
[
    {
        id: '1',
        symbol: 'ZRX/WETH',
        baseToken: 'ZRX',
        quoteToken: 'WETH',
        minOrderSize: '0.001',
        maxOrderSize: '10000',
        priceMaxDecimals: 5,
        amountMaxDecimals: 6
    },
    ...
]
```


## GET /v0/ohlcv
`public endpoint`

Reruns OHLCV data
#### parameters
* market - Symbol of a market
* period - '1m'|'5m'|'15m'|'1h'|'6h'|'1d'
* amount - (Int) How many candles to be returned

```
[
    {
        high: '0.710000000000000000',
        date: '2017-11-21T18:00:00Z',
        volume: '0.760000000000000000000000000000000000',
        low: '0.500000000000000000',
        open: '0.500000000000000000',
        close: '0.710000000000000000'
    },
    ... 
]
```


## GET /v0/ticker
`public endpoint`

Returns ticker data for a market

#### parameters
* market - Symbol of a market

```
{
    bid: '0.004'
    ask: '0.005'
    last: '0.0045'
}
```



## GET /v0/orderbook
`public endpoint`

Returns the order book for a given market. The orderbook representation merges orders of the same value to show the overall volume at each value.
#### parameters
* market - Symbol of a market
```
{
    marketId: 1,
    marketSymbol: 'REP/ETH',
    bids:[
        { amount: '300', price: '0.004' },
        { amount: '440', price: '0.003' },
        { amount: '500', price: '0.002' },
        ...
    ],
    asks:[
        { amount: '200', price: '0.005' },
        { amount: '360', price: '0.006' },
        { amount: '445', price: '0.007' },
        ...
    ]
}
```



## POST /v0/fees
`private endpoint`

Get the fees for an order.
#### parameters
* market - Symbol of a market
* orderType - 'buy'|'sell'
* price - price in quote currency
* amount - amount of base currency
* expirationDate - expiration date and time of order in ISO 8601 format

Returns:
```
{ 
    baseFeeDecimal: '1.697552694864903098033668128',
    tradingFeeDecimal: '21.21940868581128872542085161',
}
```



## POST /v0/orders
`public endpoint`

Returns the user's orders

#### parameters
* market - Symbol of a market
* state - 'all'|'unknown'|'open'|'expired'|'filled'|'unfunded'|'cancelled'

```
[
    {
        orderParams: {
            exchangeContractAddress: '0x12459c951127e0c374ff9105dda097662a027093',
            maker: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
            taker: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
            makerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
            takerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
            feeRecipient: '0xb046140686d052fff581f63f8136cce132e857da',
            makerTokenAmount: '10000000000000000',
            takerTokenAmount: '20000000000000000',
            makerFee: '100000000000000',
            takerFee: '200000000000000',
            expirationUnixTimestampSec: '1518124088',
            salt: 67006738228878699843088602623665307406148487219438534730168799356281242528500,
            ecSignature: {
                v: 27,
                r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
                s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254'
            }
        },
        id: 3423,
        price: '0.078',
        amount: '100',
        type: 'buy'|'sell',
        market: 'REP/WETH',
        orderHash: 'b41664ebbb46b42fbf32fdce8be3c8df66f354a93dd272e62421e4573a8945d8',
        state: 'unknown'|'open'|'expired'|'filled'|'unfunded'|'cancelled',
        amountRemaining: '75',
        closedAt: None,
        expiresAt: '2017-11-01T21:24:20Z'
    },
    ...
]
```


## POST /v0/viewOrder
`public endpoint`

#### parameters
* id - id of the order to view

Returns information about the order identified by the orderId passed in the url.

```
{
    orderParams: {
        exchangeContractAddress: '0x12459c951127e0c374ff9105dda097662a027093',
        maker: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
        taker: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
        makerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
        takerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
        feeRecipient: '0xb046140686d052fff581f63f8136cce132e857da',
        makerTokenAmount: '10000000000000000',
        takerTokenAmount: '20000000000000000',
        makerFee: '100000000000000',
        takerFee: '200000000000000',
        expirationUnixTimestampSec: '1518124088',
        salt: '67006738228878699843088602623665307406148487219438534730168799356281242528500',
        ecSignature: {
            v: 27,
            r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
            s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254'
        }
    },
    id: 3423,
    price: '0.078',
    amount: '100',
    type: 'buy'|'sell',
    market: 'REP/WETH',
    orderHash: 'b41664ebbb46b42fbf32fdce8be3c8df66f354a93dd272e62421e4573a8945d8',
    state: 'unknown'|'open'|'expired'|'filled'|'unfunded'|'cancelled',
    amountRemaining: '75',
    closedAt: None,
    expiresAt: '2017-11-01T21:24:20Z'
}
```


## POST /v0/viewOrderTrades
`public endpoint`

#### parameters
* id - id of the order whose trades you want to view

Returns trades and corresponding price adjustments connected with the order identified by the orderId passed in the url.
```
[
    {
        id: 2, 
        state: 'pending',
        type: 'buy'|'sell',
        amount: '10.236319460000000000',
        price: '0.073249280000000000',
        baseToken: 'REP',
        quoteToken: 'ETH',
        txHash: None,
        completedAt: None,
        baseFee: '',
        tradingFee: '',
        netAmount: '10.236319460000000000',
        priceAdjustments: []
    },
    {
        id: 1, 
        state: 'confirmed',
        type: 'buy'|'sell',
        amount: '0.011986460000000000', 
        price: '0.073249280000000000', 
        baseToken: 'REP', 
        quoteToken: 'ETH', 
        txHash: '0x1234567891234567891234567890000',
        completedAt: '2017-11-14T23:15:18Z',
        baseFee: '',
        tradingFee: '',
        netAmount: '0.011986460000000000',
        priceAdjustments: [
            {
                id: 2, 
                state: 'pending', 
                token: 'REP', 
                amount: '2.000000000000000000', 
                completedAt: None, 
                txHash: '0x234',
                feeAdjustment: '0E-18',
                netAmount: '2.000000000000000000'
            },
            {
                id: 1, 
                state: 'confirmed', 
                token: 'REP', 
                amount: '12.000000000000000000', 
                completedAt: '2017-11-14T23:15:18Z', 
                txHash: '0x23',
                feeAdjustment: '0E-18',
                netAmount: '12.000000000000000000'
            }
        ]
    }
]

```



## POST /v0/trades
`public endpoint`

Returns the users trades.

#### parameters
* market - Symbol of a market

```
[
        {
            id: 2, 
            state: 'pending',
            type: 'buy'|'sell',
            amount: '10.236319460000000000',
            price: '0.073249280000000000',
            baseToken: 'REP',
            quoteToken: 'ETH',
            txHash: None,
            createdAt: "2018-03-09T02:50:27Z"
            completedAt: None,
            baseFee: '',
            tradingFee: '',
            netAmount: '10.236319460000000000',
            priceAdjustments: []
        },
        {
            id: 1, 
            state: 'confirmed',
            type: 'buy'|'sell',
            amount: '0.011986460000000000', 
            price: '0.073249280000000000', 
            baseToken: 'REP', 
            quoteToken: 'ETH', 
            txHash: '0x1234567891234567891234567890000',
            createdAt: "2018-03-09T02:50:27Z"
            completedAt: '2017-11-14T23:15:18Z',
            baseFee: '',
            tradingFee: '',
            netAmount: '0.011986460000000000',
            priceAdjustments: [
                {
                    id: 2, 
                    state: 'pending', 
                    token: 'REP', 
                    amount: '2.000000000000000000', 
                    completedAt: None, 
                    txHash: '0x234'
                    feeAdjustment: '0E-18',
                    netAmount: '12.000000000000000000'
                },
                {
                    id: 1, 
                    state: 'confirmed', 
                    token: 'REP', 
                    amount: '12.000000000000000000', 
                    completedAt: '2017-11-14T23:15:18Z', 
                    txHash: '0x23',
                    feeAdjustment: '0E-18',
                    netAmount: '12.000000000000000000'
                }
            ]
        }
    ]
```



## POST /v0/balances
`public endpoint`

Returns the users balances.

```
[
    {
        id: 1
        name: 'REP'
        symbol: 'REP'
        balance: '1234'
        allowance: '1201'
    }
    ...
]
```



## POST /v0/orderParams
`private endpoint`

Create an unsigned 0x compatible order.
#### parameters
* market - Symbol of a market
* orderType - 'buy'|'sell'
* price - price in quote currency
* amount - amount of base currency
* expirationDate - expiration date and time of order in ISO 8601 format

The expirationDate format is 2017-11-21T18:00:00Z
Currently the expirationDate needs to be between 10 mins and 2 weeks greater than the time when the orderParams endpoint is called

Returns:
```
{
fee: { 
    id: 'b046140686d052fff581f63f8136cce1',
    baseFeeDecimal: '1.697552694864903098033668128',
    tradingFeeDecimal: '21.21940868581128872542085161'
},
zrxOrder: {
    exchangeContractAddress: '0x12459c951127e0c374ff9105dda097662a027093',
    expirationUnixTimestampSec: '1518124088',
    feeRecipient: '0xb046140686d052fff581f63f8136cce132e857da',
    maker: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
    makerFee: '100000000000000',
    makerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
    makerTokenAmount: '22000000000000000',
    salt: '54515451557974875123697849345751275676157243756715784155226239582178',
    taker: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
    takerFee: '200000000000000',
    takerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
    takerTokenAmount: '10000000000000000',
}}
```



## POST /v0/order
`private endpoint`

Creates an order on Paradex by posting a signed 0x compatible order. To get an compatible unsigned order, see the zrxOrder object returned by POST /v0/orderParams
The zrxOrder must be signed and the resultant vrs added to the order submission.
The feeId in the order submission is also returned in the orderParams endpoint in the fee object. 

#### parameters

```
{
    exchangeContractAddress: '0x12459c951127e0c374ff9105dda097662a027093',
    expirationUnixTimestampSec: '1518124088',
    feeRecipient: '0xb046140686d052fff581f63f8136cce132e857da',
    maker: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
    makerFee: '100000000000000',
    makerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
    makerTokenAmount: '22000000000000000',
    salt: '54515451557974875123697849345751275676157243756715784155226239582178',
    taker: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
    takerFee: '200000000000000',
    takerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
    takerTokenAmount: '10000000000000000',
    v: 27,
    r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
    s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254'
    feeId: hexString
}
```

**Returns**

```
{
    status: True,
    id: 23425
}
```
## POST /v0/orderCancel
`private endpoint`

cancels an order.
#### parameters
* id - id of the order you want to cancel

**Returns**
```
{
    status: true|false
}
```


## GET /v0/tradeHistory
`public endpoint`

Gets trade history for a market.
#### parameters
* market - Symbol of a market
* page - page of results (default 1)
* per_page - number of results per page (default 10, max 100)
* since - ISO 8601 start date (default now, e.g., 2018-03-07T16:31:27Z)

**Returns**
```
{
   count: 10,
   trades: [
      {
        "id": 2825,
        "created": "2018-03-14T22:19:48Z",
        "completed": "2018-03-14T22:21:05Z",
        "type": "sell",
        "price": "0.0275",
        "amount": "25",
        "total": "0.6875",
        "market": "NMR/WETH",
        "state": "confirmed"
      },
      {
        "id": 2139,
        "created": "2018-03-09T02:50:27Z",
        "completed": "2018-03-09T02:51:46Z",
        "type": "sell",
        "price": "0.033",
        "amount": "10",
        "total": "0.33",
        "market": "NMR/WETH",
        "state": "confirmed"
      },
      ...
   ]
}   
```

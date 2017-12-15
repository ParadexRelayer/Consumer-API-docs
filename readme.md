# Paradex Consumer API

[Errors](#errors)

[Misc](#misc)

[Paradex Consumer API](#paradex-consumer-api)


## Errors

| Code | Reason
| ---- | --------------------------------------- |
| 400  | Bad Request – Invalid request format    |
| 404  | Not found                               |
| 429  | Too many requests - Rate limit exceeded |
| 500  | Internal Server Error                   |
| 501  | Not Implemented                         |

## Misc

- All requests and responses are of **application/json** content type
- All token amounts are sent in amounts of the smallest level of precision (base units). (e.g if a token has 18 decimal places, selling 1 token would show up as selling `'1000000000000000000'` units in this API).
- All addresses are sent as lower-case (non-checksummed) Ethereum addresses with the `0x` prefix.


# Paradex Consumer API

APE endpoints are listed as `public` or `private`. `private` endpoints require an API key.

## GET /v0/tokens
`public endpoint`

Returns a list of token addresses and their corresponding symbol:

```
[
    {
        name: 'Ethereum',
        symbol: 'ETH',
        address: '0xTayneTayneTayneTayneTayneTayneTayneTayne'
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
        quoteToken: 'WETH'
    },
    ...
]
```


## GET /v0/ohlcv
`public endpoint`

Reruns OHLCV data
#### parameters
* market: Symbol of a market
* period: 1m|5m|15m|1h|6h|1d
* amount: (Int) How many candles to be returned

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
* market: Symbol of a market

```
{
    bid: ''
    ask: ''
    last: ''
}
```



## GET /v0/orders/
`private endpoint`

Returns the user's orders

#### parameters
* market - Symbol of a market
* orderStatus - 'all'|'unknown'|'open'|'expired'|'unfilled'|'unfunded'|'cancelled'

```
[
    {
        id: 1,
        marketId: 1, 
        type: 'buy', 
        price: '0.081632653061224490', 
        amount: '12.250000000000000000', 
        state: 'open', 
        closedAt: None, 
        expiresAt: '2017-11-01T21:24:20Z'
    }
    ...
]
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
        [<value>, <amount> ],
        [<value>, <amount> ],
        [<value>, <amount> ],
        ...
    ],
    asks:[
        [<value>, <amount> ],
        [<value>, <amount> ],
        [<value>, <amount> ],
        ...
    ]
}
```


## GET /v0/order/[orderId]
`private endpoint`

Returns information about the order identified by the orderId passed in the url. The user must be authenticated as the maker.

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
        expirationUnixTimestampSec: '42',
        salt: 67006738228878699843088602623665307406148487219438534730168799356281242528500,
        ecSignature: {
            v: 27,
            r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
            s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254'
        }
    },
    status: <orderStatus>
}
```


## GET /v0/order/[orderId]/trades
`private endpoint`

Returns trades and corresponding price adjustments connected with the order identified by the orderHash passed in the url. The user must be authenticated as the maker.
```
[
    {
        id: 2, 
        state: 'pending', 
        amount: '10.236319460000000000', 
        price: '0.073249280000000000', '
        baseToken: 'REP', 
        quoteToken: 'ETH', 
        txHash: None, 
        completedAt: None, 
        priceAdjustments: []
    },
    {
        id: 1, 
        state: 'confirmed', 
        amount: '0.011986460000000000', 
        price: '0.073249280000000000', 
        baseToken: 'REP', 
        quoteToken: 'ETH', 
        txHash: '0x1234567891234567891234567890000', 
        completedAt: '2017-11-14T23:15:18Z', 
        priceAdjustments: [
            {
                id: 2, 
                state: 'pending', 
                token: 'REP', 
                amount: '2.000000000000000000', 
                completedAt: None, 
                txHash: '0x234'
            },
            {
                id: 1, 
                state: 'confirmed', 
                token: 'REP', 
                amount: '12.000000000000000000', 
                completedAt: '2017-11-14T23:15:18Z', 
                txHash: '0x23'
            }
        ]
    }
]

```



## GET /v0/trades
`private endpoint`

Returns the users trades.

#### parameters
* market - Symbol of a market

```
[
        {
            id: 2, 
            state: 'pending', 
            amount: '10.236319460000000000', 
            price: '0.073249280000000000', '
            baseToken: 'REP', 
            quoteToken: 'ETH', 
            txHash: None, 
            completedAt: None, 
            priceAdjustments: []
        },
        {
            id: 1, 
            state: 'confirmed', 
            amount: '0.011986460000000000', 
            price: '0.073249280000000000', 
            baseToken: 'REP', 
            quoteToken: 'ETH', 
            txHash: '0x1234567891234567891234567890000', 
            completedAt: '2017-11-14T23:15:18Z', 
            priceAdjustments: [
                {
                    id: 2, 
                    state: 'pending', 
                    token: 'REP', 
                    amount: '2.000000000000000000', 
                    completedAt: None, 
                    txHash: '0x234'
                },
                {
                    id: 1, 
                    state: 'confirmed', 
                    token: 'REP', 
                    amount: '12.000000000000000000', 
                    completedAt: '2017-11-14T23:15:18Z', 
                    txHash: '0x23'
                }
            ]
        }
    ]
```



## GET /v0/balances
`private endpoint`

Returns the users balances.
#### parameters
* token - if no token set balances for all available currencies will be sent
```
[
    {
        tokenId: 1
        tokenName: 'REP'
        tokenSymbol: 'REP'
        balance: '1234'
        allowance: '1201'
    }
    ...
]
```


## POST /v0/fees
`public endpoint`

Get the fees for an order.
#### parameters
* market
* orderType
* price
* amount
* expirationDate

Returns:
```
{ 
    'baseFeeDecimal': '1.697552694864903098033668128',
    'tradingFeeDecimal': '21.21940868581128872542085161',
}
```



## POST /v0/orderParams
`private endpoint`

Create an unsigned 0x compatible order.
#### parameters
* market
* orderType
* price
* amount
* expirationDate

Returns:
```
{
'fee': { 
    'id': 'b046140686d052fff581f63f8136cce1',
    'baseFeeDecimal': '1.697552694864903098033668128',
    'tradingFeeDecimal': '21.21940868581128872542085161',
    'totalFee': '22.916961381'
},
'zrxOrder': {
    exchangeContractAddress: '0x12459c951127e0c374ff9105dda097662a027093',
    expirationUnixTimestampSec: '632',
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

Creates an order on the Paradex by posting a signed 0x compatible order. To get an compatible unsigned order, see POST /v0/orderParams

#### parameters

```
{
    exchangeContractAddress: string,
    expirationUnixTimestampSec: BigNumber,
    feeRecipient: string,
    maker: string,
    makerFee: BigNumber,
    makerTokenAddress: string,
    makerTokenAmount: BigNumber,
    salt: BigNumber,
    taker: string,
    takerFee: BigNumber,
    takerTokenAddress: string,
    takerTokenAmount: BigNumber,
    v: 27,
    r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
    s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254'
    feeId: hexString
}
```

**Returns**

```
{
    'status': True
}
```
## POST /v0/orderCancel
`private endpoint`

cancels an order.
#### parameters
* orderId

**Returns**
```
{
    status: true|false
}
```

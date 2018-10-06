# 0x v2 Migration Guide

## Allowances

The 0x v2 contracts use a new proxy contract, so you will need to set new trading allowances for your accounts. For reference, the new proxy contracts are:

```
kovan:   0xf1ec01d6236d3cd881a0bf0130ea25fe4234003e
mainnet: 0x2240dab907db71e64d3e0dba4800c83b5c502d4e
```

## /v0/orderParams

Previously, this endpoint returned an unsigned 0x order in the following foramat:
```
{
fee: { 
    id: 'b046140686d052fff581f63f8136cce1',
    baseFeeDecimal: '1.697552694864903098033668128',
    tradingFeeDecimal: '21.21940868581128872542085161',
    secundsUntilPrune: 60,
    pruneUnixTimeStamp: 2017-11-21T18:00:00Z
},
zrxOrder: {
    exchangeContractAddress: '0x12459c951127e0c374ff9105dda097662a027093',
    expirationUnixTimestampSec: '1518124088',
    feeRecipient: '0x0000000000000000000000000000000000000000',
    maker: '0x9e56625509c2f60af937f23b7b532600390e8c8b',
    makerFee: '0',
    makerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
    makerTokenAmount: '22000000000000000',
    salt: '54515451557974875123697849345751275676157243756715784155226239582178',
    taker: '0xa2b31dacf30a9c50ca473337c01d8a201ae33e32',
    takerFee: '0',
    takerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
    takerTokenAmount: '10000000000000000',
}}
```

After the migration is complete, you will receive orders in a 0x v2 compatible format:

```
{
fee: { 
    id: 'b046140686d052fff581f63f8136cce1',
    baseFeeDecimal: '1.697552694864903098033668128',
    tradingFeeDecimal: '21.21940868581128872542085161',
    secundsUntilPrune: 60,
    pruneUnixTimeStamp: 2017-11-21T18:00:00Z
},
zrxOrder {
    exchangeAddress: '0x90fe2af704b34e0224bf2299c838e04d4dcf1364'
    expirationTimeSeconds: '1539389400'
    feeRecipientAddress: '0x0000000000000000000000000000000000000000'
    makerAddress: '0x5bbbac1a500987f97ec705d5f914c45ae3549def'
    makerAssetAmount: '40000000000000000'
    makerAssetData: '0xf47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c'
    makerFee: '0'
    salt: '1538784915143'
    senderAddress: '0x0000000000000000000000000000000000000000'
    takerAddress: '0x634fce3ad082ed4efd1fa766f391f3d5bcec5c66'
    takerAssetAmount: '9145000000000000000'
    takerAssetData: '0xf47261b00000000000000000000000006ff6c0ff1d68b964901f986d4c9fa3ac68346570'
    takerFee: '0'
 }}
```

Going forward, you should expect any other endpoint that returns zrx order parameters to return the v2 order format.

## API keys
0xv2 is currently live if you'd like to test your migration. You can request an API key at:

```
https://kovan.paradex.io/developers
```
Note that we are also now requiring all newly issued API keys to first call `/verifyAddress` to enable it.
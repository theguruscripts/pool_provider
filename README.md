# pool_provider
This script can be used to swap Hive/Swap.Hive by using USWAP.APP, when the bridge unbalanced with the liquidity.  

***
## Installation
This is a nodejs based application.
```
npm install --save
```
***
## Configuration
```javascript
{
    "pool_provider_setting" : {
        "provider_status" : true,                 // If false, swap process will stop
        "bridge_account_name" : "uswap",          // The bridge token swap account name
        "split_percentage" : 15,                  // The bridge token split 
        "hive_symbol" : "HIVE",     
        "swaphive_symbol" : "SWAP.HIVE",
        "pool_account_name" : "",                 // Account name of the liquidity provider
        "pool_active_keys" : "",                  // Active keys of the liquidity provider
        "minimum_pool_amount" : 10,               // Mimnimum swap amount
        "memo_msg" : "Send Liquidity To Uswap (Hiveupme) Discounted Bridge",
        "he_setting" : {
            "contract" : "tokens",
            "table" : "balances",
            "he_action" : "transfer",
		        "he_event" : "transfer"
        },
        "timeout" : 5000,
        "block_timeout" : 30000,
	      "decimal" : 1000
    },
    "ssc_api" : "https://ha.herpc.dtools.dev",
	  "json_id" : "ssc-mainnet-hive",
    "rpc_nodes" : [
      "https://api.deathwing.me",
      "https://hive.roelandp.nl",
      "https://api.openhive.network",
      "https://rpc.ausbit.dev",
      "https://hived.emre.sh",
      "https://hive-api.arcange.eu",
      "https://api.hive.blog",
      "https://api.c0ff33a.uk",
      "https://rpc.ecency.com",
      "https://anyx.io",
      "https://techcoderx.com",
      "https://hived.privex.io",
      "https://api.followbtcnews.com/",
      "https://api.hive.blue"
    ]
}
```
***
## Execute
```
node app.js
```
***
## Development
Encounter any issue or Bugs, Please report them [Here](https://github.com/theguruscripts/pool_provider/issues).

The Script Developed by @theguruasia on HIVE.BLOG, @TheGuruAsia theguruasia#8947 on Discord.

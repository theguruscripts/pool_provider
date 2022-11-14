const { Hive } = require('@splinterlands/hive-interface');
const axios = require('axios');
const fs = require('fs');
const colors = require('colors');
const util = require('util');
const config = require('./config.json');
const { HiveEngine } = require('@splinterlands/hive-interface');
const schedule = require('node-schedule');

const SSCAPI = config.ssc_api;
const JSONID = config.json_id;
const RPCNODES = config.rpc_nodes;

const hiveio = require("@hiveio/hive-js");
hiveio.api.setOptions({url: "https://api.hive.blog"});
hiveio.config.set('alternative_api_endpoints', RPCNODES);
 
const sscjs = require('sscjs');
var sscString = SSCAPI;
var ssc = new sscjs(sscString);

const hive = new Hive({
	logging_level: 0,
	rpc_nodes: RPCNODES
});

let hive_engine = new HiveEngine({
	rpc_url: SSCAPI,
	chain_id: JSONID
});

const ISPOOLPROVIDER = config.pool_provider_setting.provider_status;
const BRIDGEACCNAME = config.pool_provider_setting.bridge_account_name;
const POOLACCNAME = config.pool_provider_setting.pool_account_name;
const POOLACTIVEKEY = config.pool_provider_setting.pool_active_keys;
const POOLMEMOMSG = config.pool_provider_setting.memo_msg;

const HIVESYMBOL = config.pool_provider_setting.hive_symbol;
const SWAPHIVESYMBOL = config.pool_provider_setting.swaphive_symbol;
var HIVEREWARDPERCENTAGE = config.pool_provider_setting.split_percentage;
HIVEREWARDPERCENTAGE = parseFloat(HIVEREWARDPERCENTAGE) || 0.0;
var MINPOOLQTY = config.pool_provider_setting.minimum_pool_amount;
MINPOOLQTY = parseFloat(MINPOOLQTY) || 0.0;

const HECONTRACT = config.pool_provider_setting.he_setting.contract;
const HETABLE = config.pool_provider_setting.he_setting.table;
const HEACTION = config.pool_provider_setting.he_setting.he_action;
const HEEVENT = config.pool_provider_setting.he_setting.he_event;

var TIMEOUT = config.pool_provider_setting.timeout;
TIMEOUT = parseInt(TIMEOUT) || 0;
var BLOCKTIMEOUT = config.pool_provider_setting.block_timeout;
BLOCKTIMEOUT = parseInt(BLOCKTIMEOUT) || 0;
var DECIMAL = config.pool_provider_setting.decimal;
DECIMAL = parseInt(DECIMAL) || 0;

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const processPoolProvider = async () => {
    try
    {
        if(ISPOOLPROVIDER == true)
        {
            var hiveQty = await getHiveBalance(BRIDGEACCNAME);
            console.log("HIVE QTY : ".yellow, hiveQty);
            var swaphiveQty = await getSwapHiveBalance(BRIDGEACCNAME);
            console.log("SWAP.HIVE QTY : ".yellow, swaphiveQty);
            var totalQty = await getTotalBalance(hiveQty, swaphiveQty);
            console.log("TOTAL QTY : ".yellow, totalQty);
            var rewardQty = await calcReward(totalQty);
            console.log("REWARD QTY : ".yellow, rewardQty);

            if(hiveQty < rewardQty)
            {
                console.log("HIVE NEEDED".yellow);
                var calcReqHive = await calcReqQty(hiveQty, rewardQty);
                console.log("REQ HIVE QTY : ".yellow, calcReqHive);
                if(calcReqHive > MINPOOLQTY)
                {
                    var processHiveStatus = await processPoolHiveLiq(calcReqHive);
                    if(processHiveStatus == true)
                    {
                        console.log("HIVE LIQUIDITY PROVIDED SUCCESSFULLY".green);
                        console.log("------------------------------------------------");
                    }
                    else
                    {
                        console.log("HIVE LIQUIDITY FAILED TO PROVIDE".red);
                        console.log("------------------------------------------------");
                    }        
                }
                else
                {
                    console.log("REQ HIVE QTY LESS THAN POOL MIN QTY".yellow);
                    console.log("------------------------------------------------");
                }
            }
            else if(swaphiveQty < rewardQty)
            {
                console.log("SWAP.HIVE NEEDED".yellow);
                var calcReqSwapHive = await calcReqQty(swaphiveQty, rewardQty);
                console.log("REQ SWAP.HIVE QTY : ".yellow, calcReqSwapHive);
                if(calcReqSwapHive > MINPOOLQTY)
                {
                    var processSwapHiveStatus = await processPoolSwapHiveLiq(calcReqSwapHive);
                    if(processSwapHiveStatus == true)
                    {
                        console.log("SWAP.HIVE LIQUIDITY PROVIDED SUCCESSFULLY".green);
                        console.log("------------------------------------------------");
                    }
                    else
                    {
                        console.log("SWAP.HIVE LIQUIDITY FAILED TO PROVIDE".red);
                        console.log("------------------------------------------------");
                    }   
                }
                else
                {
                    console.log("REQ SWAP.HIVE QTY LESS THAN POOL MIN QTY".yellow);
                    console.log("------------------------------------------------");
                }
            }
            else
            {
                console.log("THE BRIDGE IS FILLED".green);
                console.log("------------------------------------------------");
            }
        }
    }
    catch (error)
    {
        console.log("Error at processPoolProvider() : ", error);
    }
};

const getHiveBalance = async (bridgeAccount) => {
    var hiveQty = 0.0;
    try
    {
        let accountData = await hive.api('get_accounts', [[bridgeAccount]]);
		var hiveAmount = parseFloat(accountData[0].balance.replace(HIVESYMBOL, "").trim()) || 0.0;
		hiveAmount = parseFloat(hiveAmount) || 0.0;

        hiveQty = hiveAmount;
        return hiveQty;
    }
    catch (error)
    {
        console.log("Error at getHiveBalance() : ", error);
        return hiveQty;
    }
};

const getSwapHiveBalance = async (bridgeAccount) => {
	var swapBalance = 0.0;
	try 
	{
		var tokenData = await ssc.findOne(HECONTRACT, HETABLE, {account: bridgeAccount, symbol: SWAPHIVESYMBOL});
		var tokenBalance = parseFloat(tokenData.balance) || 0.0;
		tokenBalance = Math.floor(tokenBalance * DECIMAL) / DECIMAL;
		swapBalance = tokenBalance;
		return swapBalance;
	} 
	catch (error) 
	{
		console.log("Error at getSwapHiveBalance() : ", error);
		return swapBalance;
	}
};

const getTotalBalance = async (hiveQty, swaphiveQty) => {
    var totalAmount = 0.0;
    try
    {
        var totalQty =  Math.floor((hiveQty + swaphiveQty) * DECIMAL) / DECIMAL;
        totalAmount =  totalQty;
        return totalAmount;
    }
    catch (error)
    {
        console.log("Error at getTotalBalance() : ", error);
        return totalAmount;
    }
};

const calcReward = async (hiveQty) => {
	var rewardAmount = 0.0;
	try 
	{
		rewardAmount = Math.floor((hiveQty * HIVEREWARDPERCENTAGE / 100) * DECIMAL) / DECIMAL;
		rewardAmount = parseFloat(rewardAmount) || 0.0;
		return rewardAmount;
	} 
	catch (error) 
	{
		console.log("Error at calcReward() : ", error);
		return rewardAmount;
	}
};

const calcReqQty = async (existQty, rewardQty) => {
    var reqQty = 0.0;
    try
    {
        var calcQty = Math.floor((rewardQty - existQty) * DECIMAL) / DECIMAL;
        reqQty = calcQty;
        return reqQty;        
    }
    catch (error)
    {
        console.log("Error at calcReqQty() : ", error);
        return reqQty;
    }
};

const processPoolHiveLiq = async (reqHive) => {
    var poolStatus = false;
    try
    {
        reqHive = parseFloat(reqHive) || 0.0;
        var hiveQty = await getHiveBalance(POOLACCNAME);        
        hiveQty = parseFloat(hiveQty) || 0.0;
        console.log("PROVIDER HIVE LIQUIDITY : ".yellow, hiveQty);        
        if(hiveQty > 0.0 && hiveQty >= MINPOOLQTY)
        {
            if(reqHive >= hiveQty)
            {
                var hiveAmount = hiveQty.toFixed(3) + ' HIVE';
		        var transferStatus = await transferHive(hiveAmount);
                poolStatus = transferStatus;
            }
            else
            {
                var hiveAmount = Math.floor((hiveQty - reqHive) * DECIMAL) / DECIMAL;
                hiveAmount = parseFloat(hiveAmount) || 0.0;
                if(hiveAmount >= MINPOOLQTY)
                {
                    var hiveTransAmount = hiveAmount.toFixed(3) + ' HIVE';
                    var transferStatus = await transferHive(hiveTransAmount);
                    poolStatus = transferStatus;
                }
            }            
        }
        return poolStatus;
    }
    catch (error)
    {
        console.log("Error at processPoolHiveLiq() : ", error);
        return poolStatus;
    }
};

const transferHive = async (hiveAmount) => {
	var operationStatus = false;
	try 
	{		
		let transaction = await hive.transfer(POOLACCNAME, BRIDGEACCNAME, hiveAmount, POOLMEMOMSG, POOLACTIVEKEY);		
		var transactionId = transaction.id;
		if(transactionId != "")
		{
			operationStatus = true;
		}
        return operationStatus;
	} 
	catch (error) 
	{
		console.log("Error at transferHive() : ", error);
		return operationStatus;
	}
};

const processPoolSwapHiveLiq = async (reqSwapHive) => {
    var poolStatus = false;
    try
    {
        reqSwapHive = parseFloat(reqSwapHive) || 0.0;
        var swaphiveQty = await getSwapHiveBalance(POOLACCNAME);
        swaphiveQty = parseFloat(swaphiveQty) || 0.0;        
        console.log("PROVIDER SWAP.HIVE LIQUIDITY : ".yellow, swaphiveQty);
        if(swaphiveQty > 0.0 && swaphiveQty >= MINPOOLQTY)
        {
            if(reqSwapHive >= swaphiveQty)
            {
		        var transferStatus = await transferSwapHive(swaphiveQty);
                poolStatus = transferStatus;
            }
            else
            {
                var swaphiveAmount = Math.floor((swaphiveQty - reqSwapHive) * DECIMAL) / DECIMAL;
                swaphiveAmount = parseFloat(swaphiveAmount) || 0.0;
                if(swaphiveAmount >= MINPOOLQTY)
                {
                    var transferStatus = await transferSwapHive(swaphiveAmount);
                    poolStatus = transferStatus;
                }
            }            
        }
        return poolStatus;
    }
    catch (error)
    {
        console.log("Error at processPoolSwapHiveLiq() : ", error);
        return poolStatus;
    }
};

const transferSwapHive = async (hiveSwapAmount) => {
	var operationStatus = false;
	try 
	{
		var transferObj = {
			contractName: HECONTRACT,
			contractAction: HEACTION,
			contractPayload: {
				symbol: SWAPHIVESYMBOL,
				to: BRIDGEACCNAME,
				quantity: hiveSwapAmount.toFixed(3),
				memo: POOLMEMOMSG
			}
		}

		let swapTrans = await hive.custom_json(JSONID, transferObj, POOLACCNAME, POOLACTIVEKEY, true);
		console.log("LIQUIDITY TRANS : ", swapTrans);					
		await timeout(BLOCKTIMEOUT);

		let sscStatus = await ssc.getTransactionInfo(swapTrans.id);
		var logData = JSON.parse(sscStatus.logs);

		if(logData.events && logData.events[0].event == HEEVENT)
		{
			operationStatus = true;			
		}
		return operationStatus;
	} 
	catch (error) 
	{
		console.log("Error at transferSwapHive() : ", error);
		return operationStatus;
	}
};

module.exports = {
	processPoolProvider : processPoolProvider
}
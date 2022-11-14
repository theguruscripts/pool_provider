const fs = require('fs');
const colors = require('colors');
const util = require('util');
const config = require('./config.json');
const schedule = require('node-schedule');
const poolprovider = require('./poolprocess');

// POOL PROVIDER ADDED HERE
const rulePoolProvider = "0 */1 * * * *";
schedule.scheduleJob(rulePoolProvider, poolprovider.processPoolProvider);
const fs = require('fs');
const colors = require('colors');
const util = require('util');
const config = require('./config.json');
const schedule = require('node-schedule');
const poolprovider = require('./poolprocess');

const PROCESSSCHEDULE = config.pool_provider_setting.process_schedule;

// POOL PROVIDER ADDED HERE
const rulePoolProvider = PROCESSSCHEDULE;
schedule.scheduleJob(rulePoolProvider, poolprovider.processPoolProvider);
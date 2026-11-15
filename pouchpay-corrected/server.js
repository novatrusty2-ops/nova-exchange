'use strict';
const path = require('node:path');
process.env.NOVA_APP_CONFIG ||= path.join(__dirname, 'control', 'app.json');
process.env.NOVA_APP_ID ||= "pouchpay";
require("../../nova-production-ecosystem/runtime/server.cjs").start("pouchpay");

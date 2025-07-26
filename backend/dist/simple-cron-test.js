"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
console.log('Starting simple cron test...');
const job = node_cron_1.default.schedule('* * * * *', () => {
    console.log('Cron job executed at:', new Date().toISOString());
}, {
    scheduled: false
});
job.start();
console.log('Cron job started');
setInterval(() => {
}, 60000);
//# sourceMappingURL=simple-cron-test.js.map
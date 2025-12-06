import { randomUUID } from 'crypto';

function getRandomHash() {
    return randomUUID();
}

function printTimestamp(hash) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp}: ${hash}`);
}

const rs = getRandomHash();

setInterval(() => printTimestamp(rs), 5000);


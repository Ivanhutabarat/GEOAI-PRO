import * as baileys from "baileys";
const makeWASocket = baileys.default || baileys;
console.log(typeof makeWASocket === 'function');

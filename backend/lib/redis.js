import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
    url: process.env.UPSTASH_URL,
});

client.on("error", function (err) {
    throw err;
});

export default client;

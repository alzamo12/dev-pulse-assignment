import dotenv from "dotenv";
import { access } from "fs";
import path from "path";

dotenv.config({
    path: path.join(process.cwd(), ".env")
});

const config = {
    port: process.env.PORT,
    connection_string: process.env.CONNECTION_STRING,
    access_token: process.env.ACCESS_TOKEN
};

export default config;
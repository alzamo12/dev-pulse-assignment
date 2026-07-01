import app from "./app";
import config from "./config";
import { initDB } from "./db";

const main = () => {
    initDB()
    app.listen(config.port, () => {
        console.log(`dev pulse is running on port: ${config.port}`)
    });
};

main();

export default app
import app from "./app";
import config from "./config/index";
import { initDB } from "./db/index";

const main = () => {
    initDB()
    // app.listen(config.port, () => {
    //     console.log(`dev pulse is running on port: ${config.port}`)
    // });
};

main();

export default app
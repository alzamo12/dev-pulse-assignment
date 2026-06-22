import express, { type Application } from "express"
import { authRoute } from "./modules/auth/auth.route";
import { issuesRoute } from "./modules/issues/issues.route";

const app: Application = express();

app.use(express.json());
app.use(express.text());


app.get("/", async (req, res) => {
    res.send("Welcome to Dev Pulse")
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);

export default app

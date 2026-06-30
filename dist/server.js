

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  connection_string: process.env.CONNECTION_STRING,
  access_token: process.env.ACCESS_TOKEN
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(30) NOT NULL,
            email VARCHAR(30) NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role VARCHAR(15) DEFAULT 'contributor',

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()

            )
            `);
    await pool.query(`
            CREATE TABLE IF NOT EXISTS issues(
            id SERIAL PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            description TEXT CHECK (LENGTH(description) >= 20) NOT NULL,
            type VARCHAR(20),
            status VARCHAR(20) DEFAULT 'open',
            reporter_id INT REFERENCES users(id),
            
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
            `);
    console.log("database had initialized successfully");
  } catch (err) {
    console.log(err);
  }
};

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(`
        INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4, 'user'))
        RETURNING *
        `, [name, email, hashPassword, role]);
  const user = result.rows[0];
  delete user.password;
  return user;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userDetails = await pool.query(`
        SELECT * FROM users WHERE email = $1
        `, [email]);
  if (userDetails.rowCount === 0) {
    throw new Error("User not found");
  }
  ;
  const user = userDetails.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials");
  }
  ;
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.access_token, {
    expiresIn: "1d"
  });
  delete user.password;
  return { user, token };
};
var authService = {
  createUserIntoDB,
  loginUserIntoDB
};

// src/modules/auth/auth.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await authService.createUserIntoDB(req.body);
    res.status(201).send({
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
      error: err
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    const { user, token } = result;
    res.status(201).send({
      success: true,
      message: "Login Successful",
      data: {
        token,
        user
      }
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
      error: err
    });
  }
};
var authController = {
  createUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.createUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload, reporter_id) => {
  const types = ["bug", "feature_request"];
  const { title, description, type } = payload;
  if (type && !types.includes(type)) {
    throw new Error("Invalid information");
  }
  ;
  const result = await pool.query(`
        INSERT INTO issues(title, description, type, reporter_id)
                    VALUES($1, $2, $3, $4)
                    RETURNING *
        `, [title, description, type, reporter_id]);
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  const conditions = [];
  const values = [];
  let sql = `SELECT * FROM issues`;
  if (query.type) {
    values.push(query.type);
    conditions.push(`type = $${values.length}`);
  }
  if (query.status) {
    values.push(query.status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += query.sort === "oldest" ? ` ORDER BY created_at ASC` : ` ORDER BY created_at DESC`;
  const issueResult = await pool.query(sql, values);
  const issues = issueResult.rows;
  if (!issues.length) {
    return [];
  }
  const reporterIds = [
    ...new Set(issues.map((issue) => issue.reporter_id))
  ];
  const reporterResult = await pool.query(
    `
      SELECT id, name, role
      FROM users
      WHERE id = ANY($1)
    `,
    [reporterIds]
  );
  const reporterMap = new Map(
    reporterResult.rows.map((reporter) => [reporter.id, reporter])
  );
  const result = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterMap.get(issue.reporter_id),
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
  return result;
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );
  const issue = issueResult.rows[0];
  if (!issue) {
    throw new Error("Issue not found");
  }
  ;
  const { id: issueId, title, description, type, status, reporter_id, created_at, updated_at } = issue;
  const reporterResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = $1
  `,
    [reporter_id]
  );
  const reporter = reporterResult.rows[0];
  const result = {
    id: issueId,
    title,
    description,
    type,
    status,
    reporter,
    created_at,
    updated_at
  };
  return result;
};
var updateIssueInDB = async (issueId, payload, user) => {
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [issueId]
  );
  const issue = issueResult.rows[0];
  if (!issue) {
    throw new Error("issue not found");
  }
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("You can update you own issue only");
    }
    if (issue.status !== "open") {
      throw new Error("issue is not open yet");
    }
  }
  const updates = [];
  const values = [];
  if (payload.title) {
    values.push(payload.title);
    updates.push(`title = $${values.length}`);
  }
  if (payload.description) {
    values.push(payload.description);
    updates.push(`description = $${values.length}`);
  }
  if (payload.type) {
    values.push(payload.type);
    updates.push(`type = $${values.length}`);
  }
  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(issueId);
  const query = `
        UPDATE issues
        SET ${updates.join(", ")}
        WHERE id = $${values.length}
        RETURNING *
      `;
  const result = await pool.query(query, values);
  return result.rows[0];
};
var deleteIssueFromDB = async (role, id) => {
  if (role !== "maintainer") {
    throw new Error("unauthorized access");
  }
  const result = await pool.query(`
            DELETE FROM issues WHERE id=$1
        `, [id]);
};
var issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/utils/sendResponse/sendResponse.ts
var sendResponse = (res, status, success, message, data) => {
  const response = {
    success,
    message
  };
  if (success && data) {
    response.data = data;
  } else if (!success && data) {
    response.error = data;
  }
  ;
  res.status(status).send(response);
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const result = await issuesService.createIssueIntoDB(req.body, req?.user?.id);
    res.status(201).send({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: err.message,
      error: err
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const { sort = "newest", type, status } = req.query;
    const result = await issuesService.getAllIssuesFromDB({
      sort,
      type,
      status
    });
    sendResponse(res, 200, true, "Issues retrieved successfully", result);
  } catch (err) {
    sendResponse(res, 500, false, err.message, err);
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const result = await issuesService.getSingleIssueFromDB(Number(req.params.id));
    sendResponse(res, 200, true, "issue retrieved successfully", result);
  } catch (err) {
    sendResponse(res, 500, false, err.message, err);
  }
};
var updateIssue = async (req, res) => {
  try {
    const result = await issuesService.updateIssueInDB(Number(req.params.id), req.body, req.user);
    sendResponse(res, 200, true, "Issues updated successfully", result);
  } catch (err) {
    sendResponse(res, 500, false, err.message, err);
  }
};
var deleteIssue = async (req, res) => {
  try {
    const result = await issuesService.deleteIssueFromDB(req?.user?.role, Number(req.params.id));
    sendResponse(res, 200, true, "Issue deleted successfully");
  } catch (err) {
    sendResponse(res, 500, false, err.message, err);
  }
};
var issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    ;
    const decode = jwt2.verify(token, config_default.access_token);
    console.log(decode);
    const user = await pool.query(`
            SELECT * FROM users WHERE email = $1
            `, [decode.email]);
    if (user.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }
    ;
    req.user = decode;
    next();
  } catch (err) {
    next(err);
  }
};
var auth_default = auth;

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", auth_default, issuesController.createIssue);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.patch("/:id", auth_default, issuesController.updateIssue);
router2.delete("/:id", auth_default, issuesController.deleteIssue);
var issuesRoute = router2;

// src/app.ts
import cors from "cors";
var app = express();
app.use(express.json());
app.use(express.text());
app.use(cors());
app.get("/", async (req, res) => {
  res.send("Welcome to Dev Pulse");
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
};
main();
var server_default = app_default;
export {
  server_default as default
};
//# sourceMappingURL=server.js.map
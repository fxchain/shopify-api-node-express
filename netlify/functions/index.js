// import express, { Router } from "express";
import serverless from "serverless-http";
import app from "../../src/server.js";


// const api = express();

// const router = Router();
// router.get("/hello", (req, res) => res.send("Hello World!"));

// api.use("/api/", router);

export const handler = serverless(app);
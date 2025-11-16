import express, { Router } from "express";
import serverless from "serverless-http";
import app from "../../src/server.js";
const router = Router();

app.use("/api/", router);

export const handler = serverless(app);
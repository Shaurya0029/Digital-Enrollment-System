import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import hrRoutes from "./routes/hr.routes";
import userRoutes from "./routes/user.routes";
import policyRoutes from "./routes/policy.routes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json()); // MUST be after cors

app.use("/auth", authRoutes);
app.use("/hr", hrRoutes);
app.use("/users", userRoutes);
app.use("/policies", policyRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

import express from "express";
import cors from "cors";

import { httpLogger } from "./middleware/logger.middleware";
import rideRoutes from "./routes/ride.routes.js";
import rideRequestRoutes
    from "./routes/ride-request.routes.js";

const app = express();

app.use(httpLogger);

app.use(cors());
app.use(express.json());

app.use("/api/rides", rideRoutes);
app.use(
    "/api/ride-requests",
    rideRequestRoutes,
);

app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
    });
});

export default app;
import { Router } from "express";

import {
    patchRideRequest,
} from "../controllers/ride-request.controller.js";

const router = Router();

router.patch("/:requestId", patchRideRequest);

export default router;
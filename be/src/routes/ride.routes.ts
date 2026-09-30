import { Router } from "express";
import {
    getRide,
    listRides,
    patchRide,
    postRide,
    removeRide,
} from "../controllers/ride.controller.js";
import {
    listRideRequests,
    postRideRequest,
} from "../controllers/ride-request.controller.js";

const router = Router();

router.get("/", listRides);
router.post("/", postRide);

router.post("/:rideId/requests", postRideRequest);
router.get("/:rideId/requests", listRideRequests);

router.get("/:id", getRide);
router.patch("/:id", patchRide);
router.delete("/:id", removeRide);

export default router;
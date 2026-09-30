import type { Request, Response } from "express";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import {
    acceptRideRequest,
    createRideRequest,
    createUser,
    findExistingRideRequest,
    getRideRequestById,
    getRideRequests,
    getUserByPhoneNumber,
    hasRideDeparted,
    updateRideRequestStatus,
    type RideRequestStatus,
} from "../services/ride-request.service.js";

import {
    getRideById,
} from "../services/ride.service.js";

import { logger } from "../logger.js";

function normalizePhoneNumber(
    rawPhoneNumber: string,
): string | null {
    const phone = parsePhoneNumberFromString(
        rawPhoneNumber,
        "US",
    );

    if (!phone || !phone.isValid()) {
        return null;
    }

    return phone.number;
}

export async function postRideRequest(
    req: Request,
    res: Response,
) {
    const rideId = Number(req.params.rideId);

    if (!Number.isInteger(rideId) || rideId <= 0) {
        return res.status(400).json({
            message: "Invalid ride id",
        });
    }

    const { name, phoneNumber } = req.body;

    if (
        typeof name !== "string" ||
        name.trim().length === 0
    ) {
        return res.status(400).json({
            message: "name is required",
        });
    }

    if (
        typeof phoneNumber !== "string" ||
        phoneNumber.trim().length === 0
    ) {
        return res.status(400).json({
            message: "phoneNumber is required",
        });
    }

    const normalizedPhoneNumber =
        normalizePhoneNumber(phoneNumber);

    if (!normalizedPhoneNumber) {
        return res.status(400).json({
            message: "Invalid phone number",
        });
    }

    try {
        const ride = await getRideById(rideId);

        if (!ride) {
            return res.status(404).json({
                message: "Ride not found",
            });
        }

        if (ride.status !== "SCHEDULED") {
            return res.status(409).json({
                message:
                    "This ride is not accepting requests",
            });
        }

        if (hasRideDeparted(ride.departureTime)) {
            return res.status(409).json({
                message:
                    "Cannot request a ride after its departure time",
            });
        }

        let user =
            await getUserByPhoneNumber(
                normalizedPhoneNumber,
            );

        if (!user) {
            user = await createUser(
                name.trim(),
                normalizedPhoneNumber,
            );
        }

        const existingRequest =
            await findExistingRideRequest(
                rideId,
                user.id,
            );

        if (existingRequest) {
            return res.status(409).json({
                message:
                    "You have already requested this ride",
                request: existingRequest,
            });
        }

        const request = await createRideRequest(
            rideId,
            user.id,
        );

        return res.status(201).json({
            ...request,
            user: {
                id: user.id,
                name: user.name,
                phoneNumber: user.phoneNumber,
            },
        });
    } catch (error) {
        logger.error(
            {
                err: error,
                rideId,
            },
            "Failed to create ride request",
        );

        return res.status(500).json({
            message: "Failed to create ride request",
        });
    }
}

export async function listRideRequests(
    req: Request,
    res: Response,
) {
    const rideId = Number(req.params.rideId);

    if (!Number.isInteger(rideId) || rideId <= 0) {
        return res.status(400).json({
            message: "Invalid ride id",
        });
    }

    try {
        const ride = await getRideById(rideId);

        if (!ride) {
            return res.status(404).json({
                message: "Ride not found",
            });
        }

        const requests =
            await getRideRequests(rideId);

        return res.json(requests);
    } catch (error) {
        logger.error(
            {
                err: error,
                rideId,
            },
            "Failed to retrieve ride requests",
        );

        return res.status(500).json({
            message: "Failed to retrieve ride requests",
        });
    }
}

export async function patchRideRequest(
    req: Request,
    res: Response,
) {
    const requestId = Number(req.params.requestId);

    if (!Number.isInteger(requestId) || requestId <= 0) {
        return res.status(400).json({
            message: "Invalid ride request id",
        });
    }

    const { status } = req.body;

    const allowedStatuses: RideRequestStatus[] = [
        "PENDING",
        "ACCEPTED",
        "REJECTED",
        "CANCELLED",
    ];

    if (
        typeof status !== "string" ||
        !allowedStatuses.includes(status as RideRequestStatus)
    ) {
        return res.status(400).json({
            message:
                "status must be PENDING, ACCEPTED, REJECTED, or CANCELLED",
        });
    }

    try {
        const request = await getRideRequestById(requestId);

        if (!request) {
            return res.status(404).json({
                message: "Ride request not found",
            });
        }

        const ride = await getRideById(request.rideId);

        if (!ride) {
            return res.status(404).json({
                message: "Ride not found",
            });
        }

        if (ride.status !== "SCHEDULED") {
            return res.status(409).json({
                message: "Requests cannot be changed for this ride",
            });
        }

        if (hasRideDeparted(ride.departureTime)) {
            return res.status(409).json({
                message:
                    "Requests cannot be changed after departure",
            });
        }

        let updatedRequest;

        if (status === "ACCEPTED") {
            updatedRequest =
                await acceptRideRequest(requestId);
        } else {
            updatedRequest =
                await updateRideRequestStatus(
                    requestId,
                    status as RideRequestStatus,
                );
        }

        return res.json(updatedRequest);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "RIDE_FULL") {
                return res.status(409).json({
                    message: "Ride is already full",
                });
            }

            if (error.message === "RIDE_REQUEST_NOT_FOUND") {
                return res.status(404).json({
                    message: "Ride request not found",
                });
            }

            if (error.message === "RIDE_NOT_FOUND") {
                return res.status(404).json({
                    message: "Ride not found",
                });
            }
        }

        logger.error(
            {
                err: error,
                rideRequestId: requestId,
            },
            "Failed to update ride request",
        );

        return res.status(500).json({
            message: "Failed to update ride request",
        });
    }
}
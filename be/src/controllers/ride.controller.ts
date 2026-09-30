import type { Request, Response } from "express";
import { Temporal } from "temporal-polyfill/full";

import {
    createRide,
    deleteRide,
    getAllRides,
    getRideById,
    updateRide,
    type UpdateRideInput,
} from "../services/ride.service.js";

import { logger } from "../logger.js";

export async function listRides(_req: Request, res: Response) {
    try {
        const rides = await getAllRides();

        res.json(rides);
    } catch (error) {
        logger.error(
            { err: error },
            "Failed to retrieve rides",
        );

        res.status(500).json({
            message: "Failed to retrieve rides",
        });
    }
}

export async function getRide(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid ride id",
        });
    }

    try {
        const ride = await getRideById(id);

        if (!ride) {
            return res.status(404).json({
                message: "Ride not found",
            });
        }

        res.json(ride);
    } catch (error) {
        logger.error(
            {
                err: error,
                rideId: id,
            },
            "Failed to retrieve ride",
        );

        res.status(500).json({
            message: "Failed to retrieve ride",
        });
    }
}

export async function postRide(req: Request, res: Response) {
    const {
        origin,
        destination,
        departureTime,
        capacity,
        notes,
    } = req.body;

    if (
        !origin ||
        !destination ||
        !departureTime ||
        capacity === undefined
    ) {
        return res.status(400).json({
            message:
                "origin, destination, departureTime, and capacity are required",
        });
    }

    if (
        typeof origin !== "string" ||
        typeof destination !== "string" ||
        typeof departureTime !== "string"
    ) {
        return res.status(400).json({
            message:
                "origin, destination, and departureTime must be strings",
        });
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
        return res.status(400).json({
            message: "capacity must be a positive integer",
        });
    }

    if (
        notes !== undefined &&
        notes !== null &&
        typeof notes !== "string"
    ) {
        return res.status(400).json({
            message: "notes must be a string",
        });
    }

    let parsedDepartureTime: Temporal.Instant;

    try {
        parsedDepartureTime = Temporal.Instant.from(departureTime);
    } catch {
        return res.status(400).json({
            message: "departureTime must be a valid ISO timestamp",
        });
    }

    try {
        const ride = await createRide({
            origin,
            destination,
            departureTime: parsedDepartureTime,
            capacity,
            notes,
        });

        res.status(201).json(ride);
    } catch (error) {
        logger.error(
            { err: error },
            "Failed to create ride",
        );

        res.status(500).json({
            message: "Failed to create ride",
        });
    }
}

export async function patchRide(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid ride id",
        });
    }

    const data: UpdateRideInput = {};

    if (req.body.origin !== undefined) {
        if (typeof req.body.origin !== "string") {
            return res.status(400).json({
                message: "origin must be a string",
            });
        }

        data.origin = req.body.origin;
    }

    if (req.body.destination !== undefined) {
        if (typeof req.body.destination !== "string") {
            return res.status(400).json({
                message: "destination must be a string",
            });
        }

        data.destination = req.body.destination;
    }

    if (req.body.departureTime !== undefined) {
        if (typeof req.body.departureTime !== "string") {
            return res.status(400).json({
                message: "departureTime must be a string",
            });
        }

        try {
            data.departureTime = Temporal.Instant.from(
                req.body.departureTime,
            );
        } catch {
            return res.status(400).json({
                message: "departureTime must be a valid ISO timestamp",
            });
        }
    }

    if (req.body.capacity !== undefined) {
        if (
            !Number.isInteger(req.body.capacity) ||
            req.body.capacity <= 0
        ) {
            return res.status(400).json({
                message: "capacity must be a positive integer",
            });
        }

        data.capacity = req.body.capacity;
    }

    if (req.body.notes !== undefined) {
        if (
            req.body.notes !== null &&
            typeof req.body.notes !== "string"
        ) {
            return res.status(400).json({
                message: "notes must be a string or null",
            });
        }

        data.notes = req.body.notes;
    }

    if (req.body.status !== undefined) {
        const allowedStatuses = [
            "SCHEDULED",
            "CANCELLED",
            "COMPLETED",
        ] as const;

        if (!allowedStatuses.includes(req.body.status)) {
            return res.status(400).json({
                message:
                    "status must be SCHEDULED, CANCELLED, or COMPLETED",
            });
        }

        data.status = req.body.status;
    }

    if (Object.keys(data).length === 0) {
        return res.status(400).json({
            message: "No valid fields provided to update",
        });
    }

    try {
        const existingRide = await getRideById(id);

        if (!existingRide) {
            return res.status(404).json({
                message: "Ride not found",
            });
        }

        const ride = await updateRide(id, data);

        res.json(ride);
    } catch (error) {
        logger.error(
            {
                err: error,
                rideId: id,
            },
            "Failed to update ride",
        );

        res.status(500).json({
            message: "Failed to update ride",
        });
    }
}

export async function removeRide(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid ride id",
        });
    }

    try {
        const existingRide = await getRideById(id);

        if (!existingRide) {
            return res.status(404).json({
                message: "Ride not found",
            });
        }

        await deleteRide(id);

        res.status(204).send();
    } catch (error) {
        logger.error(
            {
                err: error,
                rideId: id,
            },
            "Failed to delete ride",
        );

        res.status(500).json({
            message: "Failed to delete ride",
        });
    }
}
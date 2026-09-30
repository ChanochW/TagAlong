import { Temporal } from "temporal-polyfill/full";
import { db } from "../prisma/db.js";
import { logger } from "../logger.js";

export async function getRideRequests(rideId: number) {
    return db.orm.public.RideRequest
        .where({ rideId })
        .all();
}

export async function getRideRequestById(requestId: number) {
    return db.orm.public.RideRequest
        .where({ id: requestId })
        .first();
}

export async function getUserByPhoneNumber(phoneNumber: string) {
    return db.orm.public.User
        .where({ phoneNumber })
        .first();
}

export async function createUser(
    name: string,
    phoneNumber: string,
) {
    const user = await db.orm.public.User.create({
        name,
        phoneNumber,
        phoneVerified: false,
    });

    logger.info(
        {
            userId: user.id,
        },
        "User created",
    );

    return user;
}

export async function findExistingRideRequest(
    rideId: number,
    userId: number,
) {
    return db.orm.public.RideRequest
        .where({
            rideId,
            userId,
        })
        .first();
}

export async function createRideRequest(
    rideId: number,
    userId: number,
) {
    const request = await db.orm.public.RideRequest.create({
        rideId,
        userId,
        status: "PENDING",
    });

    logger.info(
        {
            rideRequestId: request.id,
            rideId,
            userId,
        },
        "Ride request created",
    );

    return request;
}

export type RideRequestStatus =
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"
    | "CANCELLED";

export async function updateRideRequestStatus(
    requestId: number,
    status: RideRequestStatus,
) {
    const request = await db.orm.public.RideRequest
        .where({ id: requestId })
        .update({
            status,
        });

    logger.info(
        {
            rideRequestId: requestId,
            status,
        },
        "Ride request status updated",
    );

    return request;
}

export async function acceptRideRequest(requestId: number) {
    const updatedRequest = await db.transaction(async (tx) => {
        const request = await tx.orm.public.RideRequest
            .where({ id: requestId })
            .first();

        if (!request) {
            throw new Error("RIDE_REQUEST_NOT_FOUND");
        }

        const rideTable = db.sql.public.ride;

        const lockRideQuery = db.raw.sql`
            SELECT "id"
            FROM "public"."ride"
            WHERE "id" = ${request.rideId}
                FOR UPDATE
                LIMIT 1
        `
            .returnsRow({
                id: rideTable.columns.id,
            })
            .build();

        const lockedRows = await tx.query(lockRideQuery);

        if (lockedRows.length === 0) {
            throw new Error("RIDE_NOT_FOUND");
        }

        const ride = await tx.orm.public.Ride
            .where({ id: request.rideId })
            .first();

        if (!ride) {
            throw new Error("RIDE_NOT_FOUND");
        }

        if (request.status === "ACCEPTED") {
            return request;
        }

        const acceptedRequests = await tx.orm.public.RideRequest
            .where({
                rideId: request.rideId,
                status: "ACCEPTED",
            })
            .all();

        if (acceptedRequests.length >= ride.capacity) {
            throw new Error("RIDE_FULL");
        }

        const acceptedRequest = await tx.orm.public.RideRequest
            .where({ id: requestId })
            .update({
                status: "ACCEPTED",
            });

        if (!acceptedRequest) {
            throw new Error("RIDE_REQUEST_NOT_FOUND");
        }

        return acceptedRequest;
    });

    logger.info(
        {
            rideRequestId: updatedRequest.id,
            rideId: updatedRequest.rideId,
            status: "ACCEPTED",
        },
        "Ride request accepted",
    );

    return updatedRequest;
}

export function hasRideDeparted(
    departureTime: Temporal.Instant,
) {
    return Temporal.Instant.compare(
        departureTime,
        Temporal.Now.instant(),
    ) <= 0;
}
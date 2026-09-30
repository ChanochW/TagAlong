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

export async function countAcceptedRequests(rideId: number) {
    const requests = await db.orm.public.RideRequest
        .where({
            rideId,
            status: "ACCEPTED",
        })
        .all();

    return requests.length;
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

export function hasRideDeparted(
    departureTime: Temporal.Instant,
) {
    return Temporal.Instant.compare(
        departureTime,
        Temporal.Now.instant(),
    ) <= 0;
}
import { Temporal } from "temporal-polyfill/full";
import { db } from "../prisma/db.js";
import { logger } from "../logger.js";

async function getAcceptedCount(rideId: number) {
    const acceptedRequests = await db.orm.public.RideRequest
        .where({
            rideId,
            status: "ACCEPTED",
        })
        .all();

    return acceptedRequests.length;
}

async function addSeatCounts<T extends {
    id: number;
    capacity: number;
}>(ride: T) {
    const acceptedCount = await getAcceptedCount(ride.id);

    return {
        ...ride,
        acceptedCount,
        remainingSeats: Math.max(
            ride.capacity - acceptedCount,
            0,
        ),
    };
}

export async function getAllRides() {
    const rides = await db.orm.public.Ride
        .orderBy((ride) => ride.departureTime.asc())
        .all();

    return Promise.all(
        rides.map((ride) => addSeatCounts(ride)),
    );
}

export async function getRideById(id: number) {
    const ride = await db.orm.public.Ride
        .where({ id })
        .first();

    if (!ride) {
        return null;
    }

    return addSeatCounts(ride);
}

export type CreateRideInput = {
    origin: string;
    destination: string;
    departureTime: Temporal.Instant;
    capacity: number;
    notes?: string;
};

export async function createRide(data: CreateRideInput) {
    const ride = await db.orm.public.Ride.create({
        origin: data.origin,
        destination: data.destination,
        departureTime: data.departureTime,
        capacity: data.capacity,
        notes: data.notes ?? null,
    });

    logger.info(
        {
            rideId: ride.id,
            capacity: ride.capacity,
            departureTime: ride.departureTime,
        },
        "Ride created",
    );

    return {
        ...ride,
        acceptedCount: 0,
        remainingSeats: ride.capacity,
    };
}

export type UpdateRideInput = {
    origin?: string;
    destination?: string;
    departureTime?: Temporal.Instant;
    capacity?: number;
    notes?: string | null;
    status?: "SCHEDULED" | "CANCELLED" | "COMPLETED";
};

export async function updateRide(
    id: number,
    data: UpdateRideInput,
) {
    const ride = await db.orm.public.Ride
        .where({ id })
        .update(data);

    if (!ride) {
        return null;
    }

    logger.info(
        {
            rideId: id,
            changedFields: Object.keys(data),
        },
        "Ride updated",
    );

    return addSeatCounts(ride);
}

export async function deleteRide(id: number) {
    const result = await db.orm.public.Ride
        .where({ id })
        .delete();

    logger.info(
        {
            rideId: id,
        },
        "Ride deleted",
    );

    return result;
}
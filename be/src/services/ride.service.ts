import { Temporal } from "temporal-polyfill/full";
import { db } from "../prisma/db.js";
import { logger } from "../logger.js";

export async function getAllRides() {
    return db.orm.public.Ride
        .orderBy((ride) => ride.departureTime.asc())
        .all();
}

export async function getRideById(id: number) {
    return db.orm.public.Ride
        .where({ id })
        .first();
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

    return ride;
}

export type UpdateRideInput = {
    origin?: string;
    destination?: string;
    departureTime?: Temporal.Instant;
    capacity?: number;
    notes?: string | null;
    status?: "SCHEDULED" | "CANCELLED" | "COMPLETED";
};

export async function updateRide(id: number, data: UpdateRideInput) {
    const ride = await db.orm.public.Ride
        .where({ id })
        .update(data);

    logger.info(
        {
            rideId: id,
            changedFields: Object.keys(data),
        },
        "Ride updated",
    );

    return ride;
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
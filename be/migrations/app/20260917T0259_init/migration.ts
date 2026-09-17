#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5fb4ad3bcad9e8851046328e5b6cf91e2a623b1bf7a6d1bdfdcff4a8845a3095/contract';
import endContract from '../../snapshots/5fb4ad3bcad9e8851046328e5b6cf91e2a623b1bf7a6d1bdfdcff4a8845a3095/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'admin',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'chatMessage',
        columns: [
          col('adminId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('content', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('rideId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('userId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'ride',
        columns: [
          col('capacity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('departureTime', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('destination', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('origin', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('SCHEDULED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'ride_status_check_fea4c8bc',
            "\"status\" IN ('SCHEDULED', 'CANCELLED', 'COMPLETED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'rideRequest',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('rideId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'rideRequest_status_check_b5878d47',
            "\"status\" IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phoneNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phoneVerified', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'admin',
        constraint: 'admin_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'rideRequest',
        constraint: 'rideRequest_rideId_userId_key',
        columns: ['rideId', 'userId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_phoneNumber_key',
        columns: ['phoneNumber'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'chatMessage',
        index: 'chatMessage_adminId_idx_530179db',
        columns: ['adminId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'chatMessage',
        index: 'chatMessage_rideId_idx_2125d498',
        columns: ['rideId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'chatMessage',
        index: 'chatMessage_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'rideRequest',
        index: 'rideRequest_rideId_idx_2125d498',
        columns: ['rideId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'rideRequest',
        index: 'rideRequest_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'chatMessage',
        foreignKey: {
          name: 'chatMessage_rideId_fkey',
          columns: ['rideId'],
          references: { schema: 'public', table: 'ride', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'chatMessage',
        foreignKey: {
          name: 'chatMessage_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'chatMessage',
        foreignKey: {
          name: 'chatMessage_adminId_fkey',
          columns: ['adminId'],
          references: { schema: 'public', table: 'admin', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'rideRequest',
        foreignKey: {
          name: 'rideRequest_rideId_fkey',
          columns: ['rideId'],
          references: { schema: 'public', table: 'ride', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'rideRequest',
        foreignKey: {
          name: 'rideRequest_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

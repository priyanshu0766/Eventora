import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITicket extends Document {
    eventId: Types.ObjectId | string;
    userId: Types.ObjectId | string;
    clerkUserId: string;
    purchaseDate: Date;
    status: "pending" | "active" | "cancelled" | "scanned";
    amount: number;       // 0 for free, dollar amount for paid
    paymentId?: string;   // Stripe Payment Intent ID or "free_<timestamp>"
    tierId: string;
    tierName: string;
    isScanned: boolean;
    scannedAt?: Date;
}

const TicketSchema = new Schema({
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clerkUserId: { type: String, required: true },
    purchaseDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["pending", "active", "cancelled", "scanned"], default: "pending" },
    amount: { type: Number, default: 0 },
    paymentId: { type: String },
    tierId: { type: String, required: true },
    tierName: { type: String, required: true },
    isScanned: { type: Boolean, default: false },
    scannedAt: { type: Date },
});

TicketSchema.index({ clerkUserId: 1 });
TicketSchema.index({ eventId: 1 });
// Prevent exact same ticket from being created twice (idempotency)
TicketSchema.index({ eventId: 1, clerkUserId: 1, tierId: 1 }, { unique: true });

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema);

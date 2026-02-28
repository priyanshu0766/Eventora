import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITicket extends Document {
    eventId: Types.ObjectId | string;
    userId: Types.ObjectId | string;
    clerkUserId: string;
    purchaseDate: Date;
    status: "active" | "cancelled" | "scanned";
    isScanned: boolean;
    scannedAt?: Date;
    tierId: string;
    tierName: string;
}

const TicketSchema = new Schema({
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clerkUserId: { type: String, required: true },
    purchaseDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "cancelled", "scanned"], default: "active" },
    isScanned: { type: Boolean, default: false },
    scannedAt: { type: Date },
    tierId: { type: String, required: true },
    tierName: { type: String, required: true }
});

// Compound index to prevent double-booking the exact same event by the same user if desired,
// though users might want to buy multiple tickets. We will allow multiple for now if they click "Register".
// For simplicity, we just index for fast query lookups.
TicketSchema.index({ clerkUserId: 1 });
TicketSchema.index({ eventId: 1 });

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema);

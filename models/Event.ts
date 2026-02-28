import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEvent extends Document {
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate: Date;
    imageUrls?: string[];
    tickets: {
        id: string;
        name: string;
        price: number;
        capacity: number;
    }[];
    price?: number;
    capacity?: number;
    isPublished: boolean;
    category: string;
    organizerId: Types.ObjectId | string; // Reference to our MongoDB User
    clerkOrganizerId: string; // The Clerk ID for easier queries
    createdAt: Date;
}

const EventSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    imageUrls: [{ type: String }],
    tickets: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        capacity: { type: Number, required: true }
    }],
    price: { type: Number },
    capacity: { type: Number },
    isPublished: { type: Boolean, default: false },
    category: { type: String, required: true },
    organizerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clerkOrganizerId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const Event = mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    clerkId: string;
    email: string;
    name: string;
    imageUrl?: string;
    role: "admin" | "user";
    createdAt: Date;
}

const UserSchema = new Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    imageUrl: { type: String },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

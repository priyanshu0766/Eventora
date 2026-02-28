"use server";

import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models/User";
import { currentUser } from "@clerk/nextjs/server";

export async function syncUser() {
    const clerkUser = await currentUser();

    if (!clerkUser) {
        return null;
    }

    await connectToDatabase();

    const user = await User.findOneAndUpdate(
        { clerkId: clerkUser.id },
        {
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses[0].emailAddress,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
            imageUrl: clerkUser.imageUrl,
        },
        { upsert: true, new: true } // Create if doesn't exist, return new document
    );

    return JSON.parse(JSON.stringify(user));
}

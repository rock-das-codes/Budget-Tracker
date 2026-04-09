import prisma from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { UpdateUserCurrencySchema } from "@/schema/userSettings";

export async function GET(request: Request) {
    //get current user by clerk
    const user = await currentUser();

    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    let userSettings = await prisma.userSettings.findUnique({
        where: {
            userId: user.id
        }
    });

    if (!userSettings) {
        userSettings = await prisma.userSettings.create({
            data: {
                userId: user.id,
                currency: "USD",
            },
        });
    }

    revalidatePath("/");

    return Response.json(userSettings);
}

export async function PATCH(request: Request) {
    const user = await currentUser();

    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const body = await request.json();
    const parsedBody = UpdateUserCurrencySchema.safeParse(body);

    if (!parsedBody.success) {
        return new Response(JSON.stringify({ error: parsedBody.error.errors }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { currency } = parsedBody.data;

    const userSettings = await prisma.userSettings.upsert({
        where: {
            userId: user.id,
        },
        update: {
            currency,
        },
        create: {
            userId: user.id,
            currency,
        },
    });

    revalidatePath("/");

    return Response.json(userSettings);
}
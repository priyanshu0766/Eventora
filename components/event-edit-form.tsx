"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState, useRef } from "react";
import { updateEvent } from "@/actions/event";
import { useRouter } from "next/navigation";
import { CalendarIcon, Loader2, UploadCloud, X, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { RichTextEditor } from "@/components/rich-text-editor";

const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    description: z.string().min(10, "Description must be at least 10 characters."),
    location: z.string().min(3, "Location must be at least 3 characters."),
    startDate: z.date({ message: "A start date is required." }),
    endDate: z.date({ message: "An end date is required." }),
    tickets: z.array(z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required"),
        price: z.coerce.number().min(0, "Price must be 0 or greater"),
        capacity: z.coerce.number().min(1, "Capacity must be at least 1")
    })).min(1, "At least one ticket tier is required."),
    category: z.string().min(2, "category must be at least 2 characters."),
    imageUrls: z.array(z.string()).max(4, "Maximum 4 images allowed.").default([]),
});

export function EventEditForm({ event }: { event: any }) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: event.title || "",
            description: event.description || "",
            location: event.location || "",
            tickets: event.tickets && event.tickets.length > 0 ? event.tickets : [{
                id: crypto.randomUUID(),
                name: "General Admission",
                price: 0,
                capacity: 100
            }],
            category: event.category || "Technology",
            startDate: event.startDate ? new Date(event.startDate) : new Date(),
            endDate: event.endDate ? new Date(event.endDate) : new Date(),
            imageUrls: event.imageUrls || [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "tickets",
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true);
        setError(null);
        try {
            // Stringify the payload to bypass Next.js Server Action serialization limits for large base64 strings
            const result = await updateEvent(event._id, JSON.stringify(values));
            if (result.success) {
                router.push(`/events/${event._id}`);
            } else {
                setError(result.error);
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setIsPending(false);
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldChange: (value: string[]) => void, currentImages: string[]) => {
        e.preventDefault();
        if (!e.target.files) return;

        const files = Array.from(e.target.files);

        const promises = files.map((file) => {
            return new Promise<string>((resolve, reject) => {
                if (file.size > 2 * 1024 * 1024) {
                    reject(new Error(`File ${file.name} is too large. Max size is 2MB.`));
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    resolve(event.target?.result as string);
                };
                reader.onerror = () => reject(new Error("File reading failed"));
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promises).then((base64Strings) => {
            // Limit to 4 images total
            const newImages = [...currentImages, ...base64Strings].slice(0, 4);
            fieldChange(newImages);
            setError(null);
        }).catch(err => {
            setError(err.message);
        });

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeImage = (index: number, fieldChange: (value: string[]) => void, currentImages: string[]) => {
        const newImages = [...currentImages];
        newImages.splice(index, 1);
        fieldChange(newImages);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col pt-24 pb-20 px-4">
            <div className="container mx-auto max-w-5xl animate-in fade-in duration-500">

                <Button variant="ghost" className="mb-8 pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors" asChild>
                    <Link href="/dashboard/events">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Events
                    </Link>
                </Button>

                <div className="mb-10 border-b border-border/40 pb-8">
                    <h1 className="text-3xl font-semibold tracking-tight mb-2">Edit: {event.title}</h1>
                    <p className="text-muted-foreground text-base">Update your event details, manage ticketing, and upload new media assets.</p>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md border border-destructive/20 mb-8 flex items-center gap-2">
                        <X className="w-4 h-4" /> {error}
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">

                        {/* Media Upload Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            <div className="md:col-span-1">
                                <h3 className="text-lg font-medium text-foreground">Media</h3>
                                <p className="text-sm text-muted-foreground mt-1">Upload up to 4 images for your event hero banner and gallery.</p>
                            </div>
                            <div className="md:col-span-2 space-y-6">
                                <FormField
                                    control={form.control}
                                    name="imageUrls"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="space-y-4">
                                                    <div
                                                        onClick={() => field.value.length < 4 && fileInputRef.current?.click()}
                                                        className={cn(
                                                            "border border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer",
                                                            field.value.length >= 4 ? "opacity-50 border-border/50 cursor-not-allowed bg-muted/20" : "border-border/40 hover:border-foreground/30 hover:bg-muted/10 bg-background/50"
                                                        )}
                                                    >
                                                        <div className="p-3 rounded-full bg-muted/50 group-hover:scale-105 transition-transform duration-300">
                                                            <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-sm font-medium">Click to upload assets</p>
                                                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 2MB each. (Max 4)</p>
                                                        </div>
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            className="hidden"
                                                            ref={fileInputRef}
                                                            onChange={(e) => handleImageUpload(e, field.onChange, field.value)}
                                                            disabled={field.value.length >= 4}
                                                        />
                                                    </div>

                                                    {field.value.length > 0 && (
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                                            {field.value.map((imgUrl, idx) => (
                                                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-border/50 group bg-muted/20 flex items-center justify-center">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={imgUrl} alt={`Upload ${idx + 1}`} className="object-cover w-full h-full" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeImage(idx, field.onChange, field.value)}
                                                                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 shadow-sm"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator className="bg-border/40" />

                        {/* Basic Details Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            <div className="md:col-span-1">
                                <h3 className="text-lg font-medium text-foreground">Basic Details</h3>
                                <p className="text-sm text-muted-foreground mt-1">General information about what's happening and where.</p>
                            </div>
                            <div className="md:col-span-2 space-y-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-medium">Event Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Next.js Conf 2026" {...field} className="bg-transparent h-10 border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-md" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-medium">Category</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Technology" {...field} className="bg-transparent h-10 border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-md" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-medium">Location</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="San Francisco, CA" {...field} className="bg-transparent h-10 border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-md" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="font-medium">Start Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal bg-transparent h-10 border-border/40 rounded-md",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 border-border/40 bg-card rounded-md shadow-lg" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="font-medium">End Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal bg-transparent h-10 border-border/40 rounded-md",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 border-border/40 bg-card rounded-md shadow-lg" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-border/40" />

                        {/* Ticketing Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            <div className="md:col-span-1">
                                <h3 className="text-lg font-medium text-foreground">Ticketing</h3>
                                <p className="text-sm text-muted-foreground mt-1">Decide how attendees can join your event.</p>
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl border border-border/40 bg-muted/10 relative group">
                                        <div className="sm:col-span-5">
                                            <FormField
                                                control={form.control}
                                                name={`tickets.${index}.name`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium text-xs">Tier Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="General Admission" {...field} className="bg-transparent h-10 border-border/40 rounded-md focus-visible:ring-1 focus-visible:ring-ring" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="sm:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name={`tickets.${index}.price`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium text-xs">Price ($)</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                                                <Input type="number" step="0.01" {...field} className="bg-transparent h-10 pl-7 border-border/40 rounded-md focus-visible:ring-1 focus-visible:ring-ring" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="sm:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name={`tickets.${index}.capacity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium text-xs">Capacity</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} className="bg-transparent h-10 border-border/40 rounded-md focus-visible:ring-1 focus-visible:ring-ring" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex items-end justify-end sm:justify-center">
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => remove(index)}
                                                    className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => append({ id: crypto.randomUUID(), name: "", price: 0, capacity: 100 })}
                                    className="w-full border-dashed border-border/40 hover:border-foreground/30 hover:bg-muted/10 text-muted-foreground"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Ticket Tier
                                </Button>
                            </div>
                        </div>

                        <Separator className="bg-border/40" />

                        {/* About Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            <div className="md:col-span-1">
                                <h3 className="text-lg font-medium text-foreground">About</h3>
                                <p className="text-sm text-muted-foreground mt-1">Tell your attendees why they shouldn't miss it.</p>
                            </div>
                            <div className="md:col-span-2 space-y-6">
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <RichTextEditor value={field.value} onChange={field.onChange} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator className="bg-border/40" />

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isPending} className="h-10 px-8 rounded-md transition-all">
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}

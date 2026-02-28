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
import { createEvent } from "@/actions/event";
import { generateEventData } from "@/actions/generate";
import { useRouter } from "next/navigation";
import { CalendarIcon, Loader2, UploadCloud, X, Plus, Trash2, Image as ImageIcon, Wand2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { RichTextEditor } from "@/components/rich-text-editor";

const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    description: z.string().min(10, "Description must be at least 10 characters."),
    location: z.string().min(3, "Location must be at least 3 characters."),
    startDate: z.date({ message: "A start date is required." }),
    endDate: z.date({ message: "An end date is required." }),
    isPublished: z.boolean().default(true),
    tickets: z.array(z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required"),
        price: z.coerce.number().min(0, "Price must be 0 or greater"),
        capacity: z.coerce.number().min(1, "Capacity must be at least 1")
    })).min(1, "At least one ticket tier is required."),
    category: z.string().min(2, "category must be at least 2 characters."),
    imageUrls: z.array(z.string()).max(4, "Maximum 4 images allowed.").default([]),
});

export default function CreateEventPage() {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            location: "",
            isPublished: true,
            tickets: [{
                id: crypto.randomUUID(),
                name: "General Admission",
                price: 0,
                capacity: 100
            }],
            category: "Technology",
            imageUrls: [],
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
            const result = await createEvent(JSON.stringify(values));
            if (result.success) {
                router.push(`/events/${result.event._id}`);
            } else {
                setError(result.error);
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setIsPending(false);
        }
    }

    async function generateWithAI() {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        setError(null);
        try {
            const res = await generateEventData(aiPrompt);
            if (res.success && res.data) {
                const { data } = res;
                form.setValue("title", data.title || "");
                form.setValue("description", data.description || "");
                form.setValue("location", data.location || "");
                if (data.tickets && Array.isArray(data.tickets)) {
                    form.setValue("tickets", data.tickets.map((t: any) => ({
                        id: crypto.randomUUID(),
                        name: t.name || "General Admission",
                        price: t.price || 0,
                        capacity: t.capacity || 100
                    })));
                }
                form.setValue("category", data.category || "Technology");
                if (data.startDate && !isNaN(Date.parse(data.startDate))) {
                    form.setValue("startDate", new Date(data.startDate));
                }
                if (data.endDate && !isNaN(Date.parse(data.endDate))) {
                    form.setValue("endDate", new Date(data.endDate));
                }
                setAiPrompt(""); // Clear the input after success
            } else {
                setError("AI Generation failed: " + res.error);
            }
        } catch (err: any) {
            setError("Error generating event: " + err.message);
        } finally {
            setIsGenerating(false);
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

        // reset input
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

                <div className="mb-10 border-b border-border/40 pb-8">
                    <h1 className="text-3xl font-semibold tracking-tight mb-2">Create your event</h1>
                    <p className="text-muted-foreground text-base">Shape the perfect experience. Upload promotional assets, set your ticketing tiers, and publish to the world.</p>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md border border-destructive/20 mb-8 flex items-center gap-2">
                        <X className="w-4 h-4" /> {error}
                    </div>
                )}

                {/* AI Generation Box */}
                <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 rounded-2xl p-6 mb-10 overflow-hidden relative">
                    <div className="relative z-10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex-1 space-y-2 w-full">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-indigo-500" />
                                AI Magic Generator
                            </h3>
                            <p className="text-sm text-muted-foreground">Describe your ideal event in one sentence, and our AI will instantly generate the perfect title, rich description, and ticketing tiers for you.</p>
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Input
                                    placeholder="e.g. 'A 2-day Web3 coding bootcamp in Austin for 50 people...'"
                                    className="bg-background/80 border-border/50 h-11 flex-1 focus-visible:ring-1 focus-visible:ring-indigo-500 shadow-sm"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            generateWithAI();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all sm:w-auto w-full"
                                    onClick={generateWithAI}
                                    disabled={isGenerating || !aiPrompt.trim()}
                                >
                                    {isGenerating ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                                    ) : (
                                        <>Generate ✨</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

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
                                                            disabled={(date) => date < new Date()}
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
                                                            disabled={(date) => date < new Date()}
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
                                <p className="text-sm text-muted-foreground mt-1">Create multiple ticket tiers like Early Bird, VIP, or General Admission.</p>
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

                        {/* Status Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            <div className="md:col-span-1">
                                <h3 className="text-lg font-medium text-foreground">Visibility</h3>
                                <p className="text-sm text-muted-foreground mt-1">Publish now or save as a draft to edit later.</p>
                            </div>
                            <div className="md:col-span-2 space-y-6 list-none">
                                <FormField
                                    control={form.control}
                                    name="isPublished"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-md border border-border/40 bg-transparent p-4 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-sm font-medium">Publish Event</FormLabel>
                                                <FormDescription className="text-xs">If disabled, the event will be saved as a draft and only visible to you.</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
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
                                    form.watch("isPublished") ? "Publish Event to Community" : "Save as Draft"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}

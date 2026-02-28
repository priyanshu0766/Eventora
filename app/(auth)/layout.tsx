export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#f0f0f0_100%)] dark:hidden"></div>
            <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] dark:block hidden opacity-50"></div>
            {children}
        </div>
    );
}

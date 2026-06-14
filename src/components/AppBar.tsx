import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SidebarTrigger } from "./ui/sidebar";

interface AppBarProps extends React.HTMLAttributes<HTMLElement> {
    actions?: React.ReactNode;
    primaryAction?: React.ReactNode | "back" | "default";
    navigateBackPath?: string;
    withScrollEffect?: boolean;
}

export function AppBar({
    primaryAction = "default",
    navigateBackPath,
    actions,
    withScrollEffect = true,
    className,
    ...props
}: AppBarProps) {
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!withScrollEffect) return;
        const handleScroll = () => setScrolled(window.scrollY > 0);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [withScrollEffect]);

    return (
        <header
            className={cn(
                "pt-safe-top sticky top-0 z-50 w-full transition-all duration-200 text-foreground",
                // OPTIMIERT: Der Blur-Effekt funktioniert jetzt in beiden Themes perfekt
                "bg-header/80 text-header-foreground backdrop-blur-md",
                // OPTIMIERT: border-border greift automatisch auf deine global.css zurück
                scrolled ? "border-b border-border shadow-sm" : "border-b border-transparent",
                className
            )}
            {...props}
        >
            <div className="flex h-14 w-full items-center gap-4 px-4 md:px-4">
                <div className="flex flex-1 items-center gap-2 md:gap-4">
                    {primaryAction === "default" && (
                        <SidebarTrigger className="-ml-1 md:hidden" />
                    )}
                    {primaryAction === "back" && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigateBackPath ? navigate(navigateBackPath) : navigate(-1)}
                            className="shrink-0 rounded-full -ml-1 text-foreground"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    {React.isValidElement(primaryAction) && primaryAction}
                </div>


                <div className="flex items-center justify-end gap-2">
                    {actions}
                </div>
            </div>
        </header>
    );
}
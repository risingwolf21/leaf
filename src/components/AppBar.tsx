import { NewNoteModal } from "@/components/NewNoteModal";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { Button } from "@/components/ui/button";
import { useActiveFolder } from "@/hooks/useActiveFolder";
import { cn } from "@/lib/utils";
import { ArrowLeft, Leaf, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SidebarTrigger } from "./ui/sidebar";

type AppBarProps = React.HTMLAttributes<HTMLElement> & {
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
    const [newNoteOpen, setNewNoteOpen] = useState(false);
    const navigate = useNavigate();
    const { activeFolderId } = useActiveFolder();

    useEffect(() => {
        if (!withScrollEffect) return;
        const handleScroll = () => setScrolled(window.scrollY > 0);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [withScrollEffect]);

    return (
        <header
            className={cn(
                "pt-safe-top sticky top-0 z-50 w-full border-b border-border bg-background text-foreground transition-all duration-200",
                scrolled && "shadow-sm",
                className
            )}
            {...props}
        >


            <div className="flex h-14 w-full items-center gap-4 px-4 md:px-4">
                <div className="flex flex-1 items-center gap-2 md:gap-4">
                    {
                        primaryAction === "back" && (
                            <Button
                                variant="ghost"
                                onClick={() => navigateBackPath ? navigate(navigateBackPath) : navigate(-1)}
                                className="shrink-0 -ml-2 gap-1.5 rounded-full px-2 text-foreground"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span className="text-sm">Notes</span>
                            </Button>
                        )
                    }
                    {
                        primaryAction === "default" && (

                            <SidebarTrigger className="md:hidden" />
                        )
                    }
                    {
                        React.isValidElement(primaryAction) && primaryAction
                    }
                    <div className="flex flex-row items-center gap-2 font-semibold tracking-tight text-lg">
                        <Leaf className="h-5 w-5 text-primary" />
                        <span className="text-lg font-medium text-foreground">Leaf</span>
                    </div>
                </div>


                <div className="flex items-center justify-end gap-2">
                    <ThemeToggleButton />
                    <Button size="sm" className="gap-1.5" onClick={() => setNewNoteOpen(true)}>
                        <Plus className="h-4 w-4" />
                        New note
                    </Button>
                    {actions}
                </div>
            </div>
            <NewNoteModal open={newNoteOpen} onOpenChange={setNewNoteOpen} defaultFolderId={activeFolderId} />
        </header>
    );
}
import { NoteListPanel } from "@/components/notelist/NoteListPanel";
import { useSortPreference } from "@/hooks/useSortPreference";
import { cn } from "@/lib/utils";
import { Outlet, useParams } from "react-router-dom";

export default function FolderPage() {
  const { noteId } = useParams<{ noteId: string; }>()

  const [sortBy, setSortBy] = useSortPreference()

  return (
    <div className="flex h-full w-full">

      <NoteListPanel
        sortBy={sortBy}
        setSortBy={setSortBy}
        className={cn('flex',
          noteId !== undefined && 'max-md:hidden'
        )}
      />

      <Outlet />
    </div>
  )
}

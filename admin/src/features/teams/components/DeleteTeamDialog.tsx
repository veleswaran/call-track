"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteTeamDialogProps {
    teamName: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isDeleting: boolean;
}

export function DeleteTeamDialog({
    teamName,
    isOpen,
    onOpenChange,
    onConfirm,
    isDeleting,
}: DeleteTeamDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Delete Team
                    </DialogTitle>
                    <DialogDescription className="py-2">
                        Are you sure you want to delete team <span className="font-bold">&quot;{teamName}&quot;</span>?
                        This action cannot be undone and will remove all team associations.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete Team"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

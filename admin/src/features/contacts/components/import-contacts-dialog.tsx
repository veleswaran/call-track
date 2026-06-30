"use client";

import { useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { useImportContacts } from "@features/contacts/hooks/use-import-contacts";
import type { ContactImportResult } from "@shared/types";
import { Download, FileUp, Loader2 } from "lucide-react";

interface ImportContactsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TEMPLATE_CSV = "name,phone_number,is_internal\nJohn Doe,9876543210,false\nJane Smith,9123456789,true\n";

export function ImportContactsDialog({ open, onOpenChange }: ImportContactsDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [result, setResult] = useState<ContactImportResult | null>(null);
    const { mutate: importContacts, isPending } = useImportContacts();

    const resetState = () => {
        setSelectedFile(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetState();
        }
        onOpenChange(newOpen);
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "contacts-import-template.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        if (!selectedFile) {
            return;
        }

        importContacts(selectedFile, {
            onSuccess: (importResult) => {
                setResult(importResult);

                if (importResult.failed === 0) {
                    handleOpenChange(false);
                }
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Import Contacts</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with columns: name, phone_number, and optional is_internal.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="rounded-md border border-dashed p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium">CSV file</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {selectedFile ? selectedFile.name : "No file selected"}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadTemplate}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Template
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <FileUp className="mr-2 h-4 w-4" />
                                    Choose File
                                </Button>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(event) => {
                                setSelectedFile(event.target.files?.[0] ?? null);
                                setResult(null);
                            }}
                        />
                    </div>

                    {result && result.failed > 0 && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                {result.created + result.updated} imported, {result.failed} failed
                            </p>
                            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm text-amber-800 dark:text-amber-200">
                                {result.errors.map((error) => (
                                    <li key={`${error.row}-${error.message}`}>
                                        Row {error.row}: {error.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={isPending || !selectedFile}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

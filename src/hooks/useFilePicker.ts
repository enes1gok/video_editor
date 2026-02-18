import { useState } from 'react';

interface UseFilePickerOptions {
    accept: Record<string, string[]>;
    multiple?: boolean;
}

interface UseFilePickerReturn {
    pickFile: () => Promise<File | null>;
    isLoading: boolean;
    error: string | null;
}

export const useFilePicker = ({ accept }: UseFilePickerOptions): UseFilePickerReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pickFile = async (): Promise<File | null> => {
        setIsLoading(true);
        setError(null);
        try {
            // Check if File System Access API is supported
            if ('showOpenFilePicker' in window) {
                try {
                    const handles = await (window as any).showOpenFilePicker({
                        types: [
                            {
                                description: 'Media Files',
                                accept: accept,
                            },
                        ],
                        multiple: false,
                    });

                    if (handles && handles.length > 0) {
                        const file = await handles[0].getFile();
                        return file;
                    }
                } catch (err: any) {
                    // User cancelled or other error
                    if (err.name !== 'AbortError') {
                        console.error("File System Access API error:", err);
                        // Fallback to input if validation fails or other issues? 
                        // Usually showOpenFilePicker is preferred but if it throws, we might want to fallback.
                        // But for "AbortError" (cancel), we return null.
                        throw err;
                    }
                    return null;
                }
            } else {
                // Fallback to standard input
                return new Promise((resolve) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = Object.values(accept).flat().join(',');

                    input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files.length > 0) {
                            resolve(files[0]);
                        } else {
                            resolve(null);
                        }
                    };
                    input.click();
                });
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err.message || 'Error selecting file');
            }
        } finally {
            setIsLoading(false);
        }
        return null;
    };

    return { pickFile, isLoading, error };
};

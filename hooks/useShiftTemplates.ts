import { useState, useCallback, useEffect } from 'react';

export interface ShiftTemplate {
    name: string;
    value: string;
}

const TEMPLATES_STORAGE_KEY = 'bienveAppShiftTemplates';

// Default templates for new users or if localStorage is cleared.
const defaultTemplates: ShiftTemplate[] = [
    { name: "Mañana", value: "08-16" },
    { name: "Tarde", value: "16-C" },
    { name: "Noche", value: "22-06" },
    { name: "Partido", value: "12-16 20-C" },
];

export const useShiftTemplates = () => {
    const [templates, setTemplates] = useState<ShiftTemplate[]>([]);

    useEffect(() => {
        try {
            const savedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
            if (savedTemplates) {
                setTemplates(JSON.parse(savedTemplates));
            } else {
                // If no templates are saved, initialize with defaults
                setTemplates(defaultTemplates);
                localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(defaultTemplates));
            }
        } catch (error) {
            console.error("Failed to load shift templates from localStorage", error);
            setTemplates(defaultTemplates);
        }
    }, []);

    const saveTemplates = useCallback((newTemplates: ShiftTemplate[]) => {
        try {
            // Simple validation to prevent storing empty templates
            const validTemplates = newTemplates.filter(t => t.name.trim() && t.value.trim());
            setTemplates(validTemplates);
            localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(validTemplates));
        } catch (error) {
            console.error("Failed to save shift templates to localStorage", error);
        }
    }, []);

    const addTemplate = useCallback((template: ShiftTemplate) => {
        // Prevent adding duplicates by name (case-insensitive)
        if (templates.some(t => t.name.toLowerCase() === template.name.toLowerCase())) {
            // In a real app, you might use a toast notification instead of an alert.
            alert('Error: Ya existe una plantilla con ese nombre.');
            return;
        }
        const newTemplates = [...templates, template];
        saveTemplates(newTemplates);
    }, [templates, saveTemplates]);

    const deleteTemplate = useCallback((templateName: string) => {
        const newTemplates = templates.filter(t => t.name !== templateName);
        saveTemplates(newTemplates);
    }, [templates, saveTemplates]);

    return { templates, addTemplate, deleteTemplate };
};
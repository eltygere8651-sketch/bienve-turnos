import { useState, useEffect, useRef, useCallback } from 'react';

// Define the interface for the SpeechRecognition API to ensure type safety
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    // FIX: Added missing event handler properties to the SpeechRecognition interface
    // to match the Web Speech API and resolve TypeScript errors.
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

// Extend Window interface to include webkitSpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

export const useSpeechRecognition = (onResult: (transcript: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'es-ES';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: Event) => {
                console.error('Speech recognition error', event);
                setIsListening(false);
            };
            
            // FIX: Updated the onresult handler to use the correct event type, removing the need for a type assertion.
            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = event.results[0][0].transcript;
                onResult(transcript);
            };
            
            recognitionRef.current = recognition;
        } else {
            setIsSupported(false);
        }

        // Cleanup on unmount
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [onResult]);

    const toggleListening = useCallback(() => {
        if (!isSupported) return;
        
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    }, [isListening, isSupported]);

    return { isListening, isSupported, toggleListening };
};

import { useState, useEffect, useRef, useCallback } from 'react';

// Polyfill for browsers that use webkitSpeechRecognition
// FIX: Cast `window` to `any` to access non-standard browser APIs `SpeechRecognition` and `webkitSpeechRecognition`.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    // FIX: Change the type of the ref to `any` to resolve a name collision. The `SpeechRecognition` constant
    // holds the constructor, while the instance type also happens to be named `SpeechRecognition`, causing an error.
    const recognitionRef = useRef<any | null>(null);

    useEffect(() => {
        if (!SpeechRecognition) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'es-ES';
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const currentTranscript = event.results[0][0].transcript;
            setTranscript(currentTranscript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            let friendlyError = `Error de reconocimiento: ${event.error}`;
            if (event.error === 'no-speech') {
                friendlyError = 'No se ha detectado voz. Inténtalo de nuevo.';
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                friendlyError = 'Permiso para el micrófono denegado. Revísalo en los ajustes del navegador.';
            } else if (event.error === 'audio-capture') {
                friendlyError = 'No se pudo acceder al micrófono. Asegúrate de que no está siendo usado por otra aplicación.';
            }
            setError(friendlyError);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognitionRef.current = recognition;

    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            setError(null);
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Could not start recognition:", e);
                setError("No se pudo iniciar el reconocimiento. ¿Está el micrófono conectado?");
                setIsListening(false);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        hasRecognitionSupport: !!SpeechRecognition,
    };
};
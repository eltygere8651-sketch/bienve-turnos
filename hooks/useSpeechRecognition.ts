import { useState, useRef, useCallback } from 'react';
import { getShiftFromAudio } from '../services/geminiService';

interface UseSpeechRecognitionProps {
    onTranscript: (transcript: string) => void;
    onError: (error: string) => void;
}

export const useSpeechRecognition = ({ onTranscript, onError }: UseSpeechRecognitionProps) => {
    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const stopListening = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const startListening = useCallback(async () => {
        if (isListening || isTranscribing) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            onError('El reconocimiento de voz no es soportado por este navegador.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsListening(true);
            audioChunksRef.current = [];

            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = async () => {
                setIsListening(false);
                setIsTranscribing(true);

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                
                try {
                    const transcript = await getShiftFromAudio(audioBlob);
                    onTranscript(transcript);
                } catch (error) {
                    onError(error instanceof Error ? error.message : 'Un error desconocido ocurrió.');
                } finally {
                    setIsTranscribing(false);
                    // Clean up stream
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            recorder.start();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            onError('No se pudo acceder al micrófono. Por favor, comprueba los permisos.');
            setIsListening(false);
        }
    }, [isListening, isTranscribing, onError, onTranscript]);

    return {
        isListening,
        isTranscribing,
        startListening,
        stopListening,
    };
};

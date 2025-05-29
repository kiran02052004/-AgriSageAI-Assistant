
// --- BEGIN Web Speech API Type Definitions ---
// Based on MDN and standard Web Speech API specs
// These are added to satisfy TypeScript when standard DOM libs might be incomplete or misconfigured

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
  readonly interpretation?: any; 
  readonly emma?: Document;    
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string; 
  readonly message: string;
}

// This is the interface for the SpeechRecognition instance
interface SpeechRecognition extends EventTarget {
  grammars: any; // Should be SpeechGrammarList
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string;

  start(): void;
  stop(): void;
  abort(): void;

  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;

  addEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

// This is for the constructor (e.g. new SpeechRecognition())
interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

// Map event types to their event object types
interface SpeechRecognitionEventMap {
  "audiostart": Event;
  "audioend": Event;
  "end": Event;
  "error": SpeechRecognitionErrorEvent;
  "nomatch": SpeechRecognitionEvent;
  "result": SpeechRecognitionEvent;
  "soundstart": Event;
  "soundend": Event;
  "speechstart": Event;
  "speechend": Event;
  "start": Event;
}

// --- END Web Speech API Type Definitions ---


export const speak = (text: string, lang: string): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(voice => voice.lang === lang);
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith(lang.split('-')[0]));
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else if (voices.length > 0) {
        // Fallback to the first available voice if no match, or default.
        // console.warn(`No voice found for lang ${lang}. Using default.`);
    }

    utterance.pitch = 1; 
    utterance.rate = 1; 
    utterance.volume = 1; 
    
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn('Text-to-speech not supported in this browser.');
    alert('Sorry, your browser does not support text-to-speech.');
  }
};

let recognition: SpeechRecognition | null = null;

export const stopListening = (): void => {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}

export const startListening = (
  lang: string, 
  onResult: (transcript: string) => void, 
  onError: (error: string) => void,
  onEnd: () => void = () => {}
): (() => void) => { 
  const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition as SpeechRecognitionStatic | undefined;

  if (!SpeechRecognitionAPI) {
    onError('Speech recognition not supported in this browser.');
    return () => {};
  }

  if (recognition) { 
    recognition.stop();
  }

  recognition = new SpeechRecognitionAPI();
  
  recognition.lang = lang;
  recognition.interimResults = false; 
  recognition.continuous = false; 

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim();
    onResult(transcript);
    stopListening(); 
    onEnd();
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error('Speech recognition error:', event.error);
    let errorMessage = `Speech recognition error: ${event.error}.`;
    if (event.error === 'no-speech') {
        errorMessage = "No speech was detected. Please try again.";
    } else if (event.error === 'audio-capture') {
        errorMessage = "Audio capture failed. Please ensure your microphone is working.";
    } else if (event.error === 'not-allowed') {
        errorMessage = "Permission to use microphone was denied. Please allow microphone access in your browser settings.";
    } else if (event.error === 'language-not-supported') {
        errorMessage = `The selected language (${lang}) is not supported for speech recognition by your browser.`;
    }
    onError(errorMessage);
    stopListening();
    onEnd();
  };
  
  recognition.onend = () => {
    if (recognition) { 
        stopListening(); 
    }
  };

  try {
    recognition.start();
  } catch (e) {
     console.error("Error starting speech recognition:", e);
     onError(`Could not start speech recognition: ${(e as Error).message}`);
     stopListening();
     onEnd();
  }

  return () => { 
    if (recognition) {
      recognition.stop();
      recognition = null;
    }
  };
};

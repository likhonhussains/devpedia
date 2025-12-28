import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Loader2, Send, X, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
  onVoiceNoteReady: (audioUrl: string, transcription: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const VoiceRecorder = ({ onVoiceNoteReady, onCancel, isSubmitting }: VoiceRecorderProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Sample 20 points from the frequency data
    const levels: number[] = [];
    const step = Math.floor(dataArray.length / 20);
    for (let i = 0; i < 20; i++) {
      const value = dataArray[i * step] / 255;
      levels.push(value);
    }
    
    setAudioLevels(levels);
    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Set up audio analysis for waveform
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus' 
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        setAudioLevels(new Array(20).fill(0));
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);
      
      // Start audio level visualization
      animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
      
      // Timer for duration
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  }, [toast, updateAudioLevels]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [isRecording]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, audioUrl]);

  const handleSubmit = async () => {
    if (!recordedBlob) return;
    
    setIsProcessing(true);
    
    try {
      // 1. Upload audio to storage
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
      const { data: user } = await supabase.auth.getUser();
      const filePath = `${user.user?.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(filePath, recordedBlob, { contentType: 'audio/webm' });
      
      if (uploadError) throw uploadError;
      
      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('voice-notes')
        .getPublicUrl(filePath);
      
      // 3. Transcribe using edge function
      const formData = new FormData();
      formData.append('audio', recordedBlob, 'voice-note.webm');
      
      const { data: transcriptionData, error: transcribeError } = await supabase.functions
        .invoke('transcribe-voice-note', {
          body: formData,
        });
      
      if (transcribeError) {
        console.error('Transcription error:', transcribeError);
        // Continue without transcription
        onVoiceNoteReady(urlData.publicUrl, '(Transcription unavailable)');
      } else {
        onVoiceNoteReady(urlData.publicUrl, transcriptionData.text || '');
      }
      
    } catch (error) {
      console.error('Error processing voice note:', error);
      toast({
        title: 'Error',
        description: 'Failed to process voice note',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setRecordedBlob(null);
    setAudioUrl(null);
    setDuration(0);
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-muted/30">
      <AnimatePresence mode="wait">
        {!recordedBlob ? (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-4"
          >
            {isRecording ? (
              <>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-3 h-3 rounded-full bg-destructive shrink-0"
                />
                <span className="text-sm font-mono shrink-0">{formatDuration(duration)}</span>
                
                {/* Waveform Visualization */}
                <div className="flex-1 flex items-center justify-center gap-0.5 h-8 px-2">
                  {audioLevels.map((level, index) => (
                    <motion.div
                      key={index}
                      className="w-1 bg-primary rounded-full"
                      animate={{ 
                        height: Math.max(4, level * 28),
                        opacity: 0.4 + level * 0.6
                      }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                    />
                  ))}
                </div>
                
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={stopRecording}
                  className="shrink-0"
                >
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={startRecording}>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <Button 
                size="icon" 
                variant="outline" 
                onClick={togglePlayback}
                className="shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden relative">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-primary/30 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: duration, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(duration)}
                  </span>
                </div>
              </div>
              
              <audio 
                ref={audioRef} 
                src={audioUrl || undefined}
                onEnded={() => setIsPlaying(false)}
                hidden 
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleCancel}
                disabled={isProcessing || isSubmitting}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSubmit}
                disabled={isProcessing || isSubmitting}
                className="ml-auto"
              >
                {isProcessing || isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isProcessing ? 'Processing...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Voice Note
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceRecorder;

import { useState, useEffect, useRef } from 'react';
import RecordRTC from 'recordrtc';

function App() {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const ws = useRef(null);
  const recorder = useRef(null);
  const mediaStream = useRef(null);

  useEffect(() => {
    // Connect to the WebSocket server
    ws.current = new WebSocket('ws://localhost:8001/ws');

    ws.current.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.current.onmessage = (event) => {
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    ws.current.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      
      const recorderInstance = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        timeSlice: 5000, // Send data every 5 seconds
        ondataavailable: (blob) => {
          // Send audio chunk in real-time
          const reader = new FileReader();
          reader.onload = () => {
            const base64Audio = reader.result.split(',')[1];
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              ws.current.send(`data:audio/wav;base64,${base64Audio}`);
            }
          };
          reader.readAsDataURL(blob);
        }
      });
      
      recorder.current = recorderInstance;
      recorder.current.startRecording();
      setIsRecording(true);
      setMessages((prevMessages) => [...prevMessages, 'Started real-time recording...']);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (recorder.current) {
      recorder.current.stopRecording();
      setIsRecording(false);
      setMessages((prevMessages) => [...prevMessages, 'Stopped recording']);
    }
    
    // Stop all media tracks
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Real-time Audio Streaming</h1>
      <div style={{ border: '1px solid #ccc', padding: '10px', height: '300px', overflowY: 'scroll', marginBottom: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>{msg}</div>
        ))}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={startRecording} 
          disabled={isRecording}
          style={{ 
            padding: '8px 15px', 
            marginRight: '10px',
            backgroundColor: isRecording ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {isRecording ? 'Recording...' : 'Start Recording'}
        </button>
        <button 
          onClick={stopRecording} 
          disabled={!isRecording}
          style={{ 
            padding: '8px 15px',
            backgroundColor: !isRecording ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Stop Recording
        </button>
      </div>
      {isRecording && (
        <div style={{ color: 'red', fontWeight: 'bold' }}>
          🔴 Streaming audio in real-time...
        </div>
      )}
    </div>
  );
}

export default App;

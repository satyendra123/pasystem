# AudioRecorder.jsx file this code works fine. when i record the audio and the same is sending to the flask backened

import React, { useState } from 'react';
import MicRecorder from 'mic-recorder-to-mp3';
import { MdMic, MdMicOff } from 'react-icons/md';

const AudioStreaming = () => {
  const [recorder] = useState(new MicRecorder({ bitRate: 128 }));
  const [isRecording, setIsRecording] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const startRecording = (e) => {
    e.stopPropagation();
    if (isBlocked) {
      alert('Microphone access is blocked.');
    } else {
      recorder
        .start()
        .then(() => {
          setIsRecording(true);
        })
        .catch((e) => {
          console.error('Error starting the recording:', e);
        });
    }
  };

  const stopRecording = (e) => {
    e.stopPropagation();
    recorder
      .stop()
      .getMp3()
      .then(([buffer, blob]) => {
        // Convert the blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];

          // Send the base64 audio data to the Flask backend
          fetch('http://192.168.1.37:5000/upload', {  // Replace with your Flask server's IP
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audio: base64data }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log('Success:', data);
            })
            .catch((error) => {
              console.error('Error:', error);
            });
        };

        setIsRecording(false);
      })
      .catch((e) => {
        alert('We could not retrieve your message');
        console.log(e);
      });
  };

  React.useEffect(() => {
    navigator.getUserMedia(
      { audio: true },
      () => {
        setIsBlocked(false);
      },
      () => {
        setIsBlocked(true);
      }
    );
  }, []);

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <button onClick={startRecording} disabled={isRecording}>
        <MdMic style={{ height: '24px', width: '24px', marginRight: '8px' }} />
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        <MdMicOff style={{ height: '24px', width: '24px', marginRight: '8px' }} />
      </button>
    </div>
  );
};

export default AudioStreaming;

#step-2 TextMessage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { FaRegCommentDots } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './TextMessage.css'; // Import the CSS file for styling

const TextMessage = () => {
    const [message, setMessage] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const navigate = useNavigate();

    const handleIconClick = (e) => {
        e.stopPropagation();
        setShowPopup(true); // Show the popup
    };

    const handleCloseClick = (e) => {
        e.stopPropagation(); // Prevents triggering parent onClick events
        setShowPopup(false); // Hide the popup
        navigate('/'); // Navigate back to the homepage
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://192.168.1.37:5000/text-to-speech', { message });
            alert('Message sent successfully!');
            setMessage('');
            setShowPopup(false); // Hide the popup after sending
            navigate('/'); // Navigate back to the homepage
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="text-message-container">
            <FaRegCommentDots onClick={handleIconClick} style={{ cursor: 'pointer', fontSize: '24px' }} />
            {showPopup && (
                <div className="popup-container" onClick={(e) => e.stopPropagation()}>
                    <div className="popup-content">
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message..."
                                required
                                className="message-input"
                            />
                            <div className="button-group">
                                <button type="button" onClick={handleCloseClick} className="close-button">
                                    Close
                                </button>
                                <button type="submit" className="submit-button">
                                    Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextMessage;

#step-3 VideoStream.jsx
import React, { useState, useRef, useCallback } from 'react';

const VideoStream = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef(null);

  const handleFullScreenToggle = useCallback(() => {
    if (!isFullScreen) {
      setIsFullScreen(true);
    }
  }, [isFullScreen]);

  const handleClick = (e) => {
    // Only toggle full-screen if clicking on the container but not the speaker button
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      handleFullScreenToggle();
    }
  };


  return (
    <div  ref={containerRef}  style={{ 
        position: 'relative', 
        width: isFullScreen ? '100vw' : '100%', 
        height: isFullScreen ? '100vh' : '50vh',
        cursor: isFullScreen ? 'default' : 'pointer' 
      }} 
      onClick={handleClick} >
      <img src="http://127.0.0.1:5000/video_feed" alt="Video Stream" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

    </div>
  );
};

export default VideoStream;

#step-4 Home.jsx file
import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import VideoStream from "./VideoStream";
import AudioRecorder from "./AudioRecorder";
import TextMessage from "./TextMessage";

const Home = ({ Toggle }) => {
  const navigate = useNavigate();

  const handleCameraClick = (e) => {
    if (e.target.id !== "speaker-button") {
      Toggle();
      navigate("/fullscreen");
    }
  };

  return (
    <div className="px-3 bg-secondary">
      <Navbar Toggle={Toggle} />
      <div className="container-fluid">
        <div className="row g-3 my-2">
          <div className="col-md-6 p-1" onClick={handleCameraClick}>
            <div
              className="p-3 bg-white shadow-sm d-flex justify-content-around align-items-center"
              style={{ height: "50vh", cursor: "pointer", overflow: "hidden" }}
            >
              <VideoStream /> {/* VideoStream with audio toggle */}
              <div style={{ display: "flex", gap: "8px" }}>
                <AudioRecorder />
                <TextMessage />
              </div>
            </div>
          </div>
          <div className="col-md-6 p-1" onClick={handleCameraClick}>
            <div
              className="p-3 bg-white shadow-sm d-flex justify-content-around align-items-center"
              style={{ height: "50vh", cursor: "pointer", overflow: "hidden" }}
            >
              <VideoStream /> {/* Another VideoStream with audio toggle */}
              <div style={{ display: "flex", gap: "8px" }}>
                <AudioRecorder />
                <TextMessage />
              </div>
            </div>
          </div>
        </div>
        <div className="row g-3">
          <div className="col-md-6 p-1" onClick={handleCameraClick}>
            <div
              className="p-3 bg-white shadow-sm d-flex justify-content-around align-items-center"
              style={{ height: "50vh", cursor: "pointer", overflow: "hidden" }}
            >
              <VideoStream /> {/* VideoStream with audio toggle */}
              <div style={{ display: "flex", gap: "8px" }}>
                <AudioRecorder />
                <TextMessage />
              </div>
            </div>
          </div>
          <div className="col-md-6 p-1" onClick={handleCameraClick}>
            <div
              className="p-3 bg-white shadow-sm d-flex justify-content-around align-items-center"
              style={{ height: "50vh", cursor: "pointer", overflow: "hidden" }}
            >
              <VideoStream /> {/* Another VideoStream with audio toggle */}
              <div style={{ display: "flex", gap: "8px" }}>
                <AudioRecorder />
                <TextMessage />
              </div>
            </div>
          </div>
        </div>
        <table className="table caption-top bg-white rounded mt-2">
          <caption className="text-white fs-4">Recent Orders</caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">First</th>
              <th scope="col">Last</th>
              <th scope="col">Handle</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">1</th>
              <td>Mark</td>
              <td>Otto</td>
              <td>@mdo</td>
            </tr>
            <tr>
              <th scope="row">2</th>
              <td>Jacob</td>
              <td>Thornton</td>
              <td>@fat</td>
            </tr>
            <tr>
              <th scope="row">3</th>
              <td colSpan="2">Larry the Bird</td>
              <td>@twitter</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Home;


#step-2 audio.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from gtts import gTTS
import base64
import os
from playsound import playsound

app = Flask(__name__)
CORS(app)

AUDIO_FILE_PATH = "received_audio.mp3"
TEXT_TO_SPEECH_FILE_PATH = "spoken_message.mp3"

@app.route('/upload', methods=['POST'])
def upload_audio():
    data = request.json
    audio_base64 = data.get('audio')

    if not audio_base64:
        return jsonify({"error": "No audio data provided"}), 400

    try:
        with open(AUDIO_FILE_PATH, "wb") as audio_file:
            audio_file.write(base64.b64decode(audio_base64))

        print(f"File saved to {AUDIO_FILE_PATH}")

        try:
            playsound(AUDIO_FILE_PATH)
        except Exception as e:
            print(f"Error playing the audio file: {str(e)}")
            return jsonify({"error": f"Error playing the audio file: {str(e)}"}), 500

        try:
            os.remove(AUDIO_FILE_PATH)
            print(f"File {AUDIO_FILE_PATH} deleted")
        except Exception as e:
            print(f"Error deleting the file: {str(e)}")

        return jsonify({"message": "Audio received, saved, played, and deleted successfully"}), 200

    except Exception as e:
        print(f"Error processing the audio file: {str(e)}")
        return jsonify({"error": f"Error processing the audio file: {str(e)}"}), 500

@app.route('/text-to-speech', methods=['POST'])
def text_to_speech():
    data = request.json
    message = data.get('message')

    if not message:
        return jsonify({"error": "No text message provided"}), 400

    try:
        # Convert the text message to speech and save it as an MP3 file
        tts = gTTS(message)
        tts.save(TEXT_TO_SPEECH_FILE_PATH)

        # Log file saved
        print(f"File saved to {TEXT_TO_SPEECH_FILE_PATH}")

        try:
            # Play the audio file
            playsound(TEXT_TO_SPEECH_FILE_PATH)
        except Exception as e:
            # Log the error and send response
            print(f"Error playing the audio file: {str(e)}")
            return jsonify({"error": f"Error playing the audio file: {str(e)}"}), 500

        # Delete the file after playing
        try:
            os.remove(TEXT_TO_SPEECH_FILE_PATH)
            print(f"File {TEXT_TO_SPEECH_FILE_PATH} deleted")
        except Exception as e:
            # Log the error but continue to respond
            print(f"Error deleting the file: {str(e)}")

        return jsonify({"message": "Text-to-speech conversion, playback, and deletion successful"}), 200

    except Exception as e:
        # Log the error and send response
        print(f"Error processing the text message: {str(e)}")
        return jsonify({"error": f"Error processing the text message: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='192.168.1.37', port=5000, debug=True)  # Listen on all network interfaces


#step-3 in this code what we can do is we simply connects a microphone which records the audio and send this streaming audio through the html same as we have done for the webcam. there is a website running on the webpage and there is start and stop button when the user click on the start then audio can be listen through the webpage send by the raspberry pi
from flask import Flask,Response,render_template
import pyaudio

app=Flask(__name__,template_folder="template")

FORMAT=pyaudio.paInt16
CHANNELS=2
RATE=44100
CHUNK=1024
RECORD_SECONDS=5


audio_stream=pyaudio.PyAudio()


def genHeader(sampleRate, bitsPerSample, channels):
    datasize = 2000*10**6
    o = bytes("RIFF",'ascii')                                               # (4byte) Marks file as RIFF
    o += (datasize + 36).to_bytes(4,'little')                               # (4byte) File size in bytes excluding this and RIFF marker
    o += bytes("WAVE",'ascii')                                              # (4byte) File type
    o += bytes("fmt ",'ascii')                                              # (4byte) Format Chunk Marker
    o += (16).to_bytes(4,'little')                                          # (4byte) Length of above format data
    o += (1).to_bytes(2,'little')                                           # (2byte) Format type (1 - PCM)
    o += (channels).to_bytes(2,'little')                                    # (2byte)
    o += (sampleRate).to_bytes(4,'little')                                  # (4byte)
    o += (sampleRate * channels * bitsPerSample // 8).to_bytes(4,'little')  # (4byte)
    o += (channels * bitsPerSample // 8).to_bytes(2,'little')               # (2byte)
    o += (bitsPerSample).to_bytes(2,'little')                               # (2byte)
    o += bytes("data",'ascii')                                              # (4byte) Data Chunk Marker
    o += (datasize).to_bytes(4,'little')                                    # (4byte) Data size in bytes
    return o


def Sound():
    bitspersample=16
    wav_hader=genHeader(RATE,bitspersample,2)
    stream=audio_stream.open(format=FORMAT,channels=2,rate=RATE,input=True,input_device_index=1,frames_per_buffer=CHUNK)
    first_run=True
    while True:
        if first_run:
            data=wav_hader+stream.read(CHUNK)
            first_run=False
        else:
            data=stream.read(CHUNK)
        yield(data)

@app.route('/')
def index():
    return render_template("Audio.html")

@app.route("/audio")
def audio():
    return Response(Sound())

app.run(host="127.0.0.1",port=5454,threaded=True)

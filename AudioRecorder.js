#this code works fine. when i record the audio and the same is sending to the flask backened
import React, { useState } from 'react';
import MicRecorder from 'mic-recorder-to-mp3';

const AudioRecorder = () => {
  const [recorder] = useState(new MicRecorder({ bitRate: 128 }));
  const [isRecording, setIsRecording] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const startRecording = () => {
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

  const stopRecording = () => {
    recorder
      .stop()
      .getMp3()
      .then(([buffer, blob]) => {
        const file = new File(buffer, 'recording.mp3', {
          type: blob.type,
          lastModified: Date.now(),
        });

        // Automatically save the file locally
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

        // Send the audio file to the Flask backend
        const formData = new FormData();
        formData.append('file', file);

        fetch('http://localhost:5000/upload', {
          method: 'POST',
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Success:', data);
          })
          .catch((error) => {
            console.error('Error:', error);
          });

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
    <div>
      <h1>Record Your Voice</h1>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
    </div>
  );
};

export default AudioRecorder;

#step-2 audio.py
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

# Ensure the uploads folder exists
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_audio():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Save the file to the uploads directory
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    return jsonify({'message': 'File uploaded successfully', 'file_path': file_path}), 200

if __name__ == '__main__':
    app.run(debug=True)

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

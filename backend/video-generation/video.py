import json
import os
import ffmpeg
from pydub import AudioSegment
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

# change this later
userID = ""
sessionID = ""
userDir = "./session" + userID
timeline_path = "./backend/timeline.json"
# Path to your audio files and output file
output_audio = "./backend/output.wav"
# Directory for the generated frames
frame_dir = './frames'
output_video = './backend/output.mp4'
final_video = './backend/final.mp4'
fps = 60  # Frames per second for the video
# Pattern to match PNG files (frame0001.png, frame0002.png, etc.)
frame_pattern = os.path.join(frame_dir, 'frame%04d.png')


def download_audio_file(url: str, path: str):
    # currently only accepting .wav files for audio
    query_params = {"downloadformat": "wav"}
    response = requests.get(url, params=query_params)
    if response.status_code == 200:
        with open(path, 'wb') as file:
            file.write(response.content)


def generate_audio(audio_timeline: list[dict[str, str]], duration: int, session_dir: str):
    # audio_timeline = [{"audio": url, "frame": int}, {"audio": url, "frame": int}]
    print("starting audio creation")
    # Create an empty audio segment to start with (duration is in ms)
    final_audio = AudioSegment.silent(duration=duration * 1000)

    # Add each audio file to the timeline
    for index, entry in enumerate(audio_timeline):
        # {"audio": url, "frame": int}
        # Load the audio file
        audio_url: str = str(entry["audio"])
        # in session/audio directory, add audio_{index}
        audio_dir: str = os.path.join(session_dir, "audio")
        audio_path: str = os.path.join(audio_dir, "sound_" + str(index))
        # download audio from url and save it to path
        download_audio_file(audio_url, audio_path)

        # formatting audio file
        audio = AudioSegment.from_wav(audio_path)
        # start time of audio position in MILLISECONDS
        # going from frame to MS: frame / 60 * 1000 = frame * 1000 // 60
        audio_position: int = int(entry["frame"]) * 1000 // fps

        # Overlay the audio at the correct position
        final_audio = final_audio.overlay(audio, position=audio_position)

    # Export the final combined audio to a file
    output_audio = os.path.join(session_dir, "output.wav")
    final_audio.export(output_audio, format="wav")
    print(f"Audio has been generated and saved to {output_audio}")


# Function to generate a video from the PNG frames
def combine_frames():
    print("combining frames")
    try:
        ffmpeg.input(frame_pattern, framerate=fps) \
            .output(output_video, vcodec='libx264', pix_fmt='yuv420p', r=fps, loglevel='quiet') \
            .run()  # Execute the FFmpeg command

        print("Video creation finished.")

    except ffmpeg.Error as e:
        print(f"Error during video creation: {e}")

# Function to clean up the generated frames after the video is created


def clean_up():
    if os.path.exists(frame_dir):
        for file in os.listdir(frame_dir):
            file_path = os.path.join(frame_dir, file)
            if os.path.isfile(file_path):
                os.remove(file_path)
        # Remove the now-empty output directory
        os.rmdir(frame_dir)
    # removing audio and soundless video file

    for file in [output_video, output_audio]:
        if file:
            os.remove(file)
    print("Cleaned up files.")


def generate_video():
    print("Generating video")
    audio = ffmpeg.input(output_audio)
    video = ffmpeg.input(output_video)
    ffmpeg.output(video, audio, final_video, vcodec='libx264',
                  acodec='aac', strict='experimental', loglevel='quiet').run()
    print("Finished generating video")


def main():
    combine_frames()
    # generate_audio()
    generate_video()
    clean_up()


# main()


app = Flask(__name__)
CORS(app)


@app.route("/vid", methods=["POST"])
def create_video():
    # receiving json containing: user, session, sessionDir, duration, audioTimeline
    data = request.get_json()

    print("Request received from JS backend")
    print(json.dumps(data, indent=4))

    # generating audio for video (saved to sessionDir/output.wav)
    generate_audio(data["audioTimeline"], data["duration"], data["sessionDir"])
    return jsonify({"message": "video created"})


if __name__ == '__main__':
    app.run(host="localhost", debug=True, port=8000)

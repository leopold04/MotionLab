import json
import os
import ffmpeg
from pydub import AudioSegment
from flask import Blueprint, Flask, request, jsonify
from flask_cors import CORS
import requests
import time


def download_audio_file(url: str, path: str):
    # currently only accepting .wav files for audio
    query_params = {"downloadformat": "wav"}
    response = requests.get(url, params=query_params)
    if response.status_code == 200:
        with open(path, 'wb') as file:
            file.write(response.content)


def generate_audio(audio_timeline: list[dict[str, str]], duration: int, session_dir: str):
    # audio_timeline = [{"audio": url, "frame": int}, {"audio": url, "frame": int}]
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
        audio_position: int = int(entry["frame"]) * 1000 // 60

        # Overlay the audio at the correct position
        final_audio = final_audio.overlay(audio, position=audio_position)

    # Export the final combined audio to a file
    output_audio = os.path.join(session_dir, "output.wav")
    final_audio.export(output_audio, format="wav")
    print(f"Audio has been generated and saved to {output_audio}")


# Function to generate a video from the PNG frames
def combine_frames(session_dir: str):
    # where the frames are located
    frame_dir = os.path.join(session_dir, "frames")
    # file name pattern
    frame_pattern = os.path.join(frame_dir, 'frame%04d.png')
    # saving the video to sessionDir/output.mp4
    output_video = os.path.join(session_dir, "output.mp4")
    try:
        ffmpeg.input(frame_pattern, framerate=60) \
            .output(output_video, vcodec='libx264', pix_fmt='yuv420p', r=60, loglevel='quiet') \
            .run()  # Execute the FFmpeg command

        print(f"Frame sequence generated and saved to {output_video}")

    except ffmpeg.Error as e:
        print(f"Error during video creation: {e}")

# Function to clean up the generated frames after the video is created


def clean_up(session_dir: str):
    audio_dir = os.path.join(session_dir, "audio")
    frame_dir = os.path.join(session_dir, "frames")
    # removing every frame in the frame_dir
    if os.path.exists(frame_dir):
        for file in os.listdir(frame_dir):
            file_path = os.path.join(frame_dir, file)
            if os.path.isfile(file_path):
                os.remove(file_path)
        # Remove the now-empty output directory
        os.rmdir(frame_dir)

    # removing every file in the audio_dir
    if os.path.exists(audio_dir):
        for file in os.listdir(audio_dir):
            file_path = os.path.join(audio_dir, file)
            if os.path.isfile(file_path):
                os.remove(file_path)
        # Remove the now-empty output directory
        os.rmdir(audio_dir)

    # removing intermediate video and audio file
    output_audio = os.path.join(session_dir, "output.wav")
    output_video = os.path.join(session_dir, "output.mp4")
    for file in [output_video, output_audio]:
        if file:
            os.remove(file)
    print("Cleaned up intermediate files")


def generate_video(session_dir: str):
    output_audio = os.path.join(session_dir, "output.wav")
    output_video = os.path.join(session_dir, "output.mp4")
    final_video = os.path.join(session_dir, "final.mp4")

    audio = ffmpeg.input(output_audio)
    video = ffmpeg.input(output_video)
    ffmpeg.output(video, audio, final_video, vcodec='libx264',
                  acodec='aac', strict='experimental', loglevel='quiet').run()
    print("Final video saved to", final_video)


video_bp = Blueprint("video_bp", __name__)


@video_bp.route("/vid", methods=["POST"])
def create_video():
    # receiving json containing: user, session, sessionDir, duration, audioTimeline
    data = request.get_json()
    print("Request received from JS backend")
    print(json.dumps(data, indent=4))

    # generating audio (saved to sessionDir/output.wav)
    generate_audio(data["audioTimeline"], data["duration"], data["sessionDir"])

    # generating muted video (saved to sessionDir/output.mp4)
    combine_frames(data["sessionDir"])

    # combining the muted video and audio (saved to sessionDir/final.mp4)
    generate_video(data["sessionDir"])

    # cleaning up resources (deleting audio and frame directories, as well as intermediate output files)
    clean_up(data["sessionDir"])
    return jsonify({"message": "video created"})

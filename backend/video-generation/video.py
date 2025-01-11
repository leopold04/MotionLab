import json
import os
import ffmpeg
from pydub import AudioSegment
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


def generate_audio():
    print("starting audio creation")

    # Audio timeline data (replace with your actual timeline)
    with open(timeline_path) as file:
        audio_timeline = json.load(file)
    # pop audio duration from front of audiotimeline and convert from s to ms
    audio_duration = audio_timeline.pop(0)["duration"] * 1000
    # Create an empty audio segment to start with

    final_audio = AudioSegment.silent(duration=audio_duration)

    # Add each audio file to the timeline
    for entry in audio_timeline:
        # Load the audio file
        audio_path = entry["audio"]
        audio = AudioSegment.from_mp3(audio_path)

        # Calculate the time in seconds to insert the audio (frame / fps)
        # Convert seconds to milliseconds
        start_time_ms = (entry["frame"] / fps) * 1000

        # Overlay the audio at the correct position
        final_audio = final_audio.overlay(audio, position=start_time_ms)

    # Export the final combined audio to a file
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
    generate_audio()
    generate_video()
    clean_up()


main()

import os
from flask import Blueprint, request, jsonify
import requests
from user.user import create_bucket
import ffmpeg
from pydub import AudioSegment
import time
from tusclient import client
from user.user import supabase
import pytz
import datetime
import shutil


def download_audio_file(url: str, path: str):
    # currently only accepting .mp3 files for audio
    query_params = {"downloadformat": "mp3"}
    response = requests.get(url, params=query_params)
    if response.status_code == 200:
        with open(path, 'wb') as file:
            file.write(response.content)
    else:
        print(f"Failed to download audio: HTTP {response.status_code}")


def generate_audio(audio_timeline: list[dict], duration: int, session_dir: str):
    start_time = time.time()
    # audio_timeline = [{"audio": url, "frame": int}, {"audio": url, "frame": int}]
    # Create an empty audio segment to start with (duration is in ms)
    final_audio = AudioSegment.silent(duration=duration * 1000)

    # Add each audio file to the timeline
    for index, entry in enumerate(audio_timeline):
        # {"audio": url, "frame": int}
        # Load the audio file
        audio_location: str = str(entry["audio"])
        # in session/audio directory, add audio_{index}
        audio_dir: str = os.path.join(session_dir, "audio")
        # if our audio is coming from our db, then we download it
        if (audio_location.startswith("https://")):
            audio_path: str = os.path.join(audio_dir, "sound_" + str(index))
            download_audio_file(audio_location, audio_path)
        else:
            # if not, it is just the filename
            audio_path = os.path.join("../frontend/public", audio_location)

        # formatting audio file
        audio = AudioSegment.from_mp3(audio_path)
        if ("audio_duration" in entry.keys()):
            audio = audio[0:entry["audio_duration"]]
        # start time of audio position in MILLISECONDS
        # going from frame to MS: frame / 60 * 1000 = frame * 1000 // 60
        audio_position: int = int(entry["frame"]) * 1000 // 60

        # Overlay the audio at the correct position
        final_audio = final_audio.overlay(audio, position=audio_position)

    # Export the final combined audio to a file
    output_audio = os.path.join(session_dir, "output.mp3")
    final_audio.export(output_audio, format="mp3")
    print(f"Audio has been generated and saved to {output_audio}")
    time_elapsed = time.time() - start_time
    return time_elapsed


# Function to generate a video from the PNG frames
def combine_frames(session_dir: str):
    start_time = time.time()
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
    time_elapsed = time.time() - start_time
    return time_elapsed


def clean_up(session_dir: str):
    '''
    Function to clean up files after video creation
    '''
    asset_dir = os.path.join(session_dir, "assets")
    audio_dir = os.path.join(session_dir, "audio")
    frame_dir = os.path.join(session_dir, "frames")
    # removing all the intermediate directories
    shutil.rmtree(frame_dir)
    shutil.rmtree(audio_dir)
    shutil.rmtree(asset_dir)

    # removing intermediate video and audio file
    output_audio = os.path.join(session_dir, "output.mp3")
    output_video = os.path.join(session_dir, "output.mp4")
    for file in [output_video, output_audio]:
        if file:
            os.remove(file)
    print("Cleaned up intermediate files")


def generate_video(session_dir: str):
    start_time = time.time()
    output_audio = os.path.join(session_dir, "output.mp3")
    output_video = os.path.join(session_dir, "output.mp4")
    final_video = os.path.join(session_dir, "final.mp4")

    audio = ffmpeg.input(output_audio)
    video = ffmpeg.input(output_video)
    ffmpeg.output(video, audio, final_video, vcodec='libx264',
                  acodec='aac', strict='experimental', loglevel='quiet').run()
    print("Final video generated and saved to", final_video)
    video_integration_time = time.time() - start_time
    return final_video, video_integration_time


def upload_video(file, user, session):
    '''
    Uploads a completed video to a user's video folder inside their bucket
    Then returns the URL of the generated video
    '''
    start_time = time.time()

    # initialize the TUS client
    tus_client = client.TusClient(
        f"{supabase.supabase_url}/storage/v1/upload/resumable",
        headers={"Authorization": f"Bearer {
            supabase.supabase_key}", "x-upsert": "true"},
    )

    # create a bucket for the user if you have not already
    create_bucket(user)
    bucket_path = "videos/video_" + session
    uploader = tus_client.uploader(
        file_stream=file,
        chunk_size=(6 * 1024 * 1024),
        metadata={
            "bucketName": user,
            "objectName": bucket_path,
            "contentType": "video/mp4",
            "cacheControl": "3600",
        },
    )
    uploader.upload()
    # retrieving public url for the video we just uploaded
    video_url = supabase.storage.from_(user).get_public_url(bucket_path)
    print(f"Uploaded video to supabase at {user}/{bucket_path}")
    upload_time = time.time() - start_time
    return video_url, upload_time


# creation of video blueprint
video_bp = Blueprint("video_bp", __name__)


@video_bp.route("/video/create_video", methods=["POST"])
def create_video():
    # receiving json containing: user, session, sessionDir, duration, audioTimeline
    data = request.get_json()
    print("Request received from express server")

    # generating audio (saved to sessionDir/output.mp3)
    audio_creation_time = generate_audio(
        data["audioTimeline"], data["duration"], data["sessionDir"])

    # generating muted video (saved to sessionDir/output.mp4)
    frame_combination_time = combine_frames(data["sessionDir"])

    # combining the muted video and audio (saved to sessionDir/final.mp4)
    video_path, audio_integration_time = generate_video(data["sessionDir"])

    # cleaning up resources (deleting audio and frame directories, as well as intermediate output files)
    clean_up(data["sessionDir"])

    # upload the file to supabase using TUS protocol
    with open(video_path, "rb") as file:
        video_url, upload_time = upload_video(
            file, str(data["user"]), str(data["session"]))
    total_time = data["assetLoadTime"] + data["frameWriteTime"] + \
        frame_combination_time + audio_creation_time + \
        audio_integration_time + upload_time

    timezone = pytz.timezone("US/Eastern")
    now = datetime.datetime.now(pytz.utc)
    localized_time = now.astimezone(timezone)
    # time formatting
    creation_time = localized_time.strftime("%m-%d-%Y %I:%M%p").lower()

    video_info = {
        # video indentification information
        "url": video_url,
        "user": data["user"],
        "template": data["template"],
        "resolution": data["resolution"],
        "duration": data["duration"],
        "created_at": creation_time,
        # video creation information
        "asset_load_time": data["assetLoadTime"],
        "frame_write_time": data["frameWriteTime"],
        "frame_combination_time": frame_combination_time,
        "audio_creation_time": audio_creation_time,
        "audio_integration_time": audio_integration_time,
        "upload_time": upload_time,
        "total_time": total_time
    }
    # updating the videos table in our database
    supabase.table("Videos").insert(video_info).execute()
    # returning the video info
    return jsonify(video_info), 200

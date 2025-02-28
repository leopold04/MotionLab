import os
from dotenv import load_dotenv, dotenv_values
from flask import Blueprint, Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import json
from supabase import create_client, Client
from utils.gif_utils import extract_frames, get_fps, create_directory
import time
import shutil


file_bp = Blueprint("file_bp", __name__)


# maps file extensions to the appropriate http header
content_map = {
    "mp3": "audio/mpeg",
    "jpeg": "image/jpeg",
    "jpg": "image/jpg",
    "png": "image/png",
    "gif": "image/gif"
}


def get_file_extension(filename):
    '''Returns the extension of a file'''
    return filename.split(".")[1]


@file_bp.route("/file/upload_file", methods=["POST"])
def upload_asset():
    start_time = time.time()
    # receiving file and filename from client
    # look up flask.Request in docs for other info
    file = request.files['file']
    filename = request.form["filename"]
    userID, sessionID = request.form["userID"], request.form["sessionID"]
    bytes = file.read()
    print("Asset received from the frontend")

    # directories
    video_dir = "../videos"
    user_dir = os.path.join(video_dir, userID)
    session_dir = os.path.join(user_dir, sessionID)
    asset_dir = os.path.join(session_dir, "assets")
    # we will put our file into one of these directories within our asset directory
    sound_dir = os.path.join(asset_dir, "sounds")
    image_dir = os.path.join(asset_dir, "images")
    sequence_dir = os.path.join(asset_dir, "frame_sequences")

    # placing the file depending on what the extension is
    extension = get_file_extension(filename)

    match extension:
        case "mp3":
            file_path = os.path.join(sound_dir, filename)
        case "jpeg":
            file_path = os.path.join(image_dir, filename)
        case "jpg":
            file_path = os.path.join(image_dir, filename)

        case "png":
            file_path = os.path.join(image_dir, filename)
        case "gif":
            # extract the frames and put them in our sequence directory
            output_folder = os.path.join(sequence_dir, filename.split(".")[0])
            gif_info = extract_frames(bytes, filename, output_folder)

    if extension != "gif":
        # just write the bytes to the appropriate place in the asset directory
        try:
            with open(file_path, "wb") as f:
                f.write(bytes)
                # we return the file path relative to the ROOT directory, not backend now
                # ../videos/user/session/assets => videos/user/session/assets
                file_path = file_path[3:]
            return jsonify({"src": file_path, "content-type": content_map[extension]}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "could not upload file"}), 400
    else:
        # file writing has already been done, so we just return the gif info
        # removing the ../ prefix
        output_folder = output_folder[3:]
        return jsonify({"src": output_folder, "gif_frame_count": gif_info["frame_count"], "gif_fps": gif_info["fps"], "content-type": content_map[extension]})

# downloads a gif from a url, creates a directory for the frames in the user's video assets dir
# then dumps all the frames into that directory


def download_gif(url: str, user: str):
    # TODO
    pass


@file_bp.route("/file/get_note_count/<path:file_path>")
def get_note_count(file_path):
    '''
    Returns the number of note files in a given folder
    '''
    try:
        path = os.path.join("../", file_path)
        note_count = len(os.listdir(path))
        return jsonify({"note_count": note_count}), 200
    except:
        return jsonify({"message": "could not count files"}), 400


@file_bp.route("/file/get_asset/<path:file_path>")
def send_asset(file_path):
    '''
    Serves file relative to our ROOT directory
    If the file comes from ../assets and not ../videos, we cache it, since it will never change
    '''
    response = send_from_directory("../", file_path)
    if file_path.startswith("assets"):
        # caching the response since our static assets will not change
        response.headers['Cache-Control'] = 'public, max-age=31536000'

    return response


@file_bp.route("/file/default_configs", methods=["GET"])
def read_defaults():
    response = send_from_directory("./", "default-configs.json")
    return response


@file_bp.route("/file/element_map", methods=["GET"])
def read_elements():
    response = send_from_directory("./", "element-map.json")

    return response


@file_bp.route("/file/setup_directories", methods=["POST"])
def setup_directories():
    data = request.get_json()
    userID, sessionID = data["userID"], data["sessionID"]
    # relative to the directory where we run the main python file (our current working directory)
    video_dir = "../videos"
    user_dir = os.path.join(video_dir, userID)
    session_dir = os.path.join(user_dir, sessionID)
    # assets the user either chooses or adds
    # we load audio, images, etc from this directory by serving them as static files
    asset_dir = os.path.join(session_dir, "assets")
    sound_dir = os.path.join(asset_dir, "sounds")
    image_dir = os.path.join(asset_dir, "images")
    sequence_dir = os.path.join(asset_dir, "frame_sequences")

    # full animation frames go here
    frame_dir = os.path.join(session_dir, "frames")
    # fully processed audio goes here
    audio_dir = os.path.join(session_dir, "audio")

    try:
        create_directory(user_dir)
        create_directory(session_dir)
        create_directory(asset_dir)
        create_directory(sound_dir)
        create_directory(image_dir)
        create_directory(sequence_dir)
        create_directory(frame_dir)
        create_directory(audio_dir)
        return jsonify({"message": "successfully set up directories"})
    except Exception as e:
        print(e)
        return jsonify({"message": "could not create directories"})


@file_bp.route("/file/clear_session", methods=["POST", "OPTIONS"])
def clear_session_directory():
    # we received raw bytes from our frontend, so we have to decode it
    data = request.data
    # decoding it into string format
    data_str = data.decode("utf-8")
    userInfo = json.loads(data_str)
    userID, sessionID = userInfo["userID"], userInfo["sessionID"]
    video_dir = "../videos"
    user_dir = os.path.join(video_dir, userID)
    session_dir = os.path.join(user_dir, sessionID)
    try:
        if (os.path.isdir(session_dir)):
            shutil.rmtree(session_dir)
        return jsonify({"message": f"successfully removed {session_dir}"}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred"}), 400

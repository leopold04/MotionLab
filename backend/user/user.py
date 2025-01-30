import os
from dotenv import load_dotenv, dotenv_values
from flask import Blueprint, Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from supabase import create_client, Client
from video_generation.utils import extract_frames, get_fps, remove_directory
load_dotenv()
supabase_url: str = str(os.environ.get("SUPABASE_URL"))
supabase_key: str = str(os.environ.get("SUPABASE_KEY"))
supabase: Client = create_client(supabase_url, supabase_key)

# maps file extensions to the appropriate http header
content_map = {
    "mp3": "audio/mpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif"
}


def get_file_extension(filename):
    '''Returns the extension of a file'''
    return filename.split(".")[1]


def create_bucket(name: str):
    '''Creates a bucket for a user if it does not already exist'''
    response = supabase.storage.list_buckets()
    buckets = []
    for bucket in response:
        buckets.append(bucket.name)
    if name not in buckets:
        supabase.storage.create_bucket(name, options={"public": True})


def upload_file(user: str, bytes: bytes, bucket_path: str, content_type: str):
    '''
    uploads a file to a bucket in supabase
    '''
    response = supabase.storage.from_(user).upload(
        file=bytes, path=bucket_path, file_options={"content-type": content_type, "upsert": "true"})


user_bp = Blueprint("user_bp", __name__)


@user_bp.route("/user/upload_file", methods=["POST"])
def upload_asset_to_supabase():
    # receiving file and filename from client
    # look up flask.Request in docs for other info
    file = request.files['file']
    filename = request.form["filename"]
    userID = request.form["userID"]
    bytes = file.read()
    print("Asset received from the frontend")
    # make the bucket for the user if it does not exist
    # change get user function
    create_bucket(userID)
    extension = get_file_extension(filename)

    match extension:
        case "mp3":
            bucket_path = "assets/sounds/" + filename
        case "jpeg":
            bucket_path = "assets/images/" + filename
        case "png":
            bucket_path = "assets/images/" + filename
        case "gif":
            # send to processing to extract the frames
            bucket_path = "assets/frame_sequences/" + filename.split(".")[0]
            # extract the frames
            gif_info = extract_frames(bytes, userID)

    if extension != "gif":
        # uploading the file
        upload_file(userID, bytes, bucket_path, content_map[extension])
        # getting the url of the file we just uploaded
        file_url = supabase.storage.from_(userID).get_public_url(bucket_path)
        print(file_url)
        # returning the URL of the file in a supabase bucket
        print("Asset successfully uploaded to supabase")
        return jsonify({"url": file_url}, {"content-type": content_map[extension]})
    else:
        try:
            for i in range(1, gif_info["frame_count"]):
                # "123".zfill(5) = "00123"
                frame = f"{gif_info["output_folder"]
                           }/frame{str(i).zfill(4)}.png"
                with open(frame, "rb") as f:
                    upload_file(userID, f.read(), f"{
                                bucket_path}/frame{str(i).zfill(4)}.png", content_map[extension])
        except Exception as e:
            # if we get an error (such as if all the frames don't get exported properly), we delete the folder
            print(e)
            remove_directory(gif_info["output_folder"])
            # returning the url of the bucket where all of the frames are stored
        print("Successfully uploaded frame sequence to supabase")
        base_url = f"{
            supabase_url}/storage/v1/object/public/{userID}/{bucket_path}/"
        # removing the directory from our file system
        remove_directory(gif_info["output_folder"])
        return jsonify({"url": base_url, "gif_frame_count": gif_info["frame_count"], "gif_fps": gif_info["fps"], "content-type": content_map[extension]})


@user_bp.route("/user/default_configs", methods=["GET"])
def read_defaults():
    file = "default-configs.json"
    if os.path.exists(file):
        with open(file, "r") as f:
            return json.load(f)
    return "Fail", 400


@user_bp.route("/user/element_map", methods=["GET"])
def read_elements():
    file = "element-map.json"
    if os.path.exists(file):
        with open(file, "r") as f:
            return json.load(f)
    return "Fail", 400

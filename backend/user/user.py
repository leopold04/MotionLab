import os
from dotenv import load_dotenv, dotenv_values
from flask import Blueprint, Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from supabase import create_client, Client

load_dotenv()
supabase_url: str = str(os.environ.get("SUPABASE_URL"))
supabase_key: str = str(os.environ.get("SUPABASE_KEY"))
supabase: Client = create_client(supabase_url, supabase_key)

# maps file extensions to the appropriate http header
content_map = {
    "mp3": "audio/mpeg",
    "jpeg": "image/jpeg",
    "png": "image/png"
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


user_bp = Blueprint("user_bp", __name__)


@user_bp.route("/user/upload_file", methods=["POST"])
def upload_asset():
    # receiving file and filename from client
    # look up flask.Request in docs for other info
    file = request.files['file']
    filename = request.form["filename"]
    userID = request.form["userID"]
    bytes = file.read()

    # make the bucket for the user if it does not exist
    # change get user function
    create_bucket(userID)
    extension = get_file_extension(filename)

    if (extension == "mp3"):
        bucket_path = "assets/sounds/" + filename
    else:
        bucket_path = "assets/images/" + filename

    response = supabase.storage.from_(userID).upload(
        file=bytes, path=bucket_path, file_options={"content-type": content_map[extension], "upsert": "true"})

    file_url = supabase.storage.from_(userID).get_public_url(bucket_path)
    # returning the URL of the file in a supabase bucket
    return jsonify({"url": file_url})


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

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
    "wav": "audio/x-wav",
    "jpeg": "image/jpeg",
    "png": "image/png"
}

# returns file extension


def get_file_extension(filename):
    return filename.split(".")[1]

# returns a list of bucket NAMES


def get_buckets():
    response = supabase.storage.list_buckets()
    buckets = []
    for bucket in response:
        buckets.append(bucket.name)
    return buckets


def create_bucket(name: str):
    response = supabase.storage.create_bucket(name, options={"public": True})


user_bp = Blueprint("user_bp", __name__)


@user_bp.route("/user/upload_file", methods=["POST"])
def upload_asset():
    # receiving file and filename from client
    # look up flask.Request in docs for other info
    file = request.files['file']
    filename = request.form["filename"]
    bytes = file.read()

    # make the bucket for the user if it does not exist
    username = "user1234"
    if username not in get_buckets():
        create_bucket(username)
    extension = get_file_extension(filename)

    if (extension == "wav"):
        bucket_path = "assets/sounds/" + filename
    else:
        bucket_path = "assets/images/" + filename

    response = supabase.storage.from_(username).upload(
        file=bytes, path=bucket_path, file_options={"content-type": content_map[extension], "upsert": "true"})

    file_url = supabase.storage.from_(username).get_public_url(bucket_path)
    # returning the URL of the file in a supabase bucket
    print(file_url)
    return jsonify({"url": file_url})

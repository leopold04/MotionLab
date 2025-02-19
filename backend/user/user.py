import os
from dotenv import load_dotenv, dotenv_values
from flask import Blueprint, Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from supabase import create_client, Client
load_dotenv()
supabase_url: str = str(os.environ.get("SUPABASE_URL"))
supabase_key: str = str(os.environ.get("SUPABASE_KEY"))
supabase: Client = create_client(supabase_url, supabase_key)


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

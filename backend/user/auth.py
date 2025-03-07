
import os
from dotenv import load_dotenv, dotenv_values
from flask import Blueprint, Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from supabase import create_client, Client
load_dotenv()
supabase_url: str = str(os.environ.get("SUPABASE_URL"))
supabase_key: str = str(os.environ.get("SUPABASE_KEY"))
supabase: Client = create_client(supabase_url, supabase_key)
auth_bp = Blueprint("auth_bp", __name__)


'''
auth
- sign in
- sign out
- create community invite link
- handle custom user table in db (userid, email, invite link, plan, date created, last sign in)
- set plan
- forgot password
'''

from video_generation.video import video_bp
from user.user import user_bp
from utils.file_utils import file_bp
from flask import Flask, Blueprint, request, jsonify
from flask_cors import CORS
import os
app = Flask(__name__)
CORS(app)
app.register_blueprint(video_bp)
app.register_blueprint(user_bp)
app.register_blueprint(file_bp)

if __name__ == '__main__':
    app.run(host="localhost", debug=True, port=8000)

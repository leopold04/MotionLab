import ffmpeg
import os
from pydub import AudioSegment
import requests
from PIL import Image  # Importing PIL for image processing
import shutil


def create_directory(path):
    '''
    create directory if it does not exist
    '''
    if not os.path.exists(path):
        try:
            os.makedirs(path, exist_ok=True)
        except OSError as e:
            print(e)


def get_fps(bytes) -> int:
    path = "file"
    with open(path, "wb") as f:
        f.write(bytes)
    # Run ffmpeg to retrieve the metadata of the video
    probe = ffmpeg.probe(path, v='error', select_streams='v:0',
                         show_entries='stream=r_frame_rate')

    # Extract the frame rate from the probe result
    fps = probe['streams'][0]['r_frame_rate']
    num, denom = map(int, fps.split('/'))
    os.remove(path)
    return int(num / denom)


def compress_png(input_file, output_file, quality=80):
    """
    Compress a PNG image using Pillow.
    - Convert the image to a palette-based format with 256 colors.
    - Optimize the image to reduce the file size.
    """
    img = Image.open(input_file)
    img = img.convert("P", colors=256)  # Convert to 256-color palette
    img.save(output_file, optimize=True)  # Save optimized PNG


def compress_images(output_folder):
    """
    Compress all PNG files in the 'output_folder' directory using the compress_png function.
    """
    for filename in os.listdir(output_folder):
        if filename.endswith(".png"):
            try:
                input_path = os.path.join(output_folder, filename)
                output_path = os.path.join(output_folder, f"frame{filename}")
                compress_png(input_path, output_path)
                # Optionally remove the original uncompressed image
                os.remove(input_path)
            except Exception as e:
                print(e)


# returns frame path, frame count, and fps
def extract_frames(bytes, userID):
    # later, make sure we are creating files in a unique place

    path = "file"
    with open(path, "wb") as f:
        f.write(bytes)
    output_folder = f"extracted{userID}"
    os.makedirs(output_folder, exist_ok=True)

    # Use FFmpeg to extract frames as PNG images (still images, not video)
    ffmpeg.input(path).output(
        f'{output_folder}/%04d.png',
        # Scale the frames to width 720 (height auto-calculated)
        vf="scale=720:-1", loglevel="quiet"
    ).run()

    # Compress PNGs using PIL after extraction
    compress_images(output_folder)
    # Remove the video file from the filesystem after we are done
    os.remove(path)
    # be sure to return the fps of the
    print("Frames extracted and compressed successfully!")
    # number of frames we extracted

    frame_count = len(os.listdir(output_folder))

    # fps of our gif
    frames_per_second = get_fps(bytes)

    return {"output_folder": output_folder, "frame_count": frame_count, "fps": frames_per_second}


'''
with open("dance.gif", "rb") as f:
    extract_frames(f.read(), "0")
'''

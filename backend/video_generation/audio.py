'''
For local development only
- turning midi files into directories of sounds (individual .wav files)
- uploading directories to supabase to allow users to play from them
- custoff all overlap between notes. 

prompt:
suppose i wanted to sepate a midi file into individual notes. is there a way i could go through the midi file, delete the overlap between 2 notes that play (for example, if node 1 plays from 0:05 to 0:10 and note 2 plays from 0:06 to 0:08, we cut off note 1 from 0:06 to 0:10), so that it only sounds like 1 note is playing at a time.

i want to do this in python. how?
'''
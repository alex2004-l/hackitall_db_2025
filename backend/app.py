from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import io

import firebase_admin
from firebase_admin import credentials, auth, firestore

import os
from werkzeug.utils import secure_filename

from PIL import Image

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'static/user_uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

PROFILES_COLLECTION = "User"

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# decorator to require and verify Firebase ID token
def firebase_token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            return jsonify({"error": "Missing Authorization header"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid Authorization header format"}), 401

        id_token = parts[1]
        try:
            decoded_token = auth.verify_id_token(id_token)
            request.user = decoded_token
        except Exception as e:
            return jsonify({"error": "Invalid or expired token", "detail": str(e)}), 401

        return f(*args, **kwargs)
    return wrapper


@app.route("/profile/init", methods=["POST"])
@firebase_token_required
def init_profile():
    """Initializes a new user profile in Firestore."""

    user_uid = request.user["uid"]
    user_email = request.user.get("email", "player")
    print(f"Initializing profile for user: {user_uid}")

    DEFAULT_PIC_PATH = "static/system_defaults/user.jpg" 

    try:
        profile_ref = db.collection(PROFILES_COLLECTION).document(user_uid)
        profile_doc = profile_ref.get()
        
        if not profile_doc.exists:
            default_username = user_email.split("@")[0] if user_email else "ArcadePlayer"

            profile_ref.set({
                "username": default_username,
                "profilePictureUrl": DEFAULT_PIC_PATH,
                "createdAt": firestore.SERVER_TIMESTAMP
            })

            print(f"Profile created with default username: {default_username}")
            return jsonify({"message": "Profile initialized", "created": True}), 201
        else:
            print("Profile already exists")
            return jsonify({"message": "Profile already exists", "created": False}), 200

    except Exception as e:
        print(f"Error initializing profile: {e}")
        return jsonify({"error": "Failed to initialize profile"}), 500


@app.route("/profile", methods=["GET"])
@firebase_token_required
def get_profile():
    """Fetches the profile data, which now includes the local file path."""
    user_uid = request.user["uid"]
    print(f"Fetching profile for user: {user_uid}")

    try:
        profile_ref = db.collection(PROFILES_COLLECTION).document(user_uid)
        profile_doc = profile_ref.get()
        
        profile_data = profile_doc.to_dict() if profile_doc.exists else {}
        print(f"Profile data retrieved: {profile_data}")
        
        return jsonify({
            "username": profile_data.get("username", "ArcadePlayer"),
            "profilePictureUrl": profile_data.get("profilePictureUrl", "static/system_defaults/user.jpg")
        }), 200

    except Exception as e:
        print(f"Error fetching profile: {e}")
        return jsonify({"error": "Failed to fetch profile"}), 500


@app.route("/profile", methods=["PUT"])
@firebase_token_required
def update_profile():

    user_uid = request.user["uid"]
    data = request.get_json()
    print(f"PUT /profile request for user: {user_uid}")
    
    if not data:
        return jsonify({"error": "No data provided"}), 400

    update_data = {}
    
    # Handle username update
    if "username" in data and isinstance(data["username"], str) and data["username"].strip():
        update_data["username"] = data["username"].strip()
        print(f"Updating username: {update_data['username']}")

    # Handle profile picture URL update (This allows the frontend to save the URL/path returned from the POST endpoint)
    if "profilePictureUrl" in data and isinstance(data["profilePictureUrl"], str):
        update_data["profilePictureUrl"] = data["profilePictureUrl"]
        print(f"Updating profile picture URL: {update_data['profilePictureUrl']}")


    if not update_data:
        print("No valid fields to update")
        return jsonify({"error": "No valid fields to update"}), 400

    try:
        profile_ref = db.collection(PROFILES_COLLECTION).document(user_uid)
        profile_ref.set(update_data, merge=True)
        print(f"Profile updated successfully for user {user_uid}")
        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        print(f"Error updating profile: {e}")
        return jsonify({"error": "Failed to update profile"}), 500


# app.py (Modified upload_profile_picture function)
@app.route("/profile/picture", methods=["POST"])
@firebase_token_required
def upload_profile_picture():
    user_uid = request.user["uid"]
    
    if 'profilePicture' not in request.files:
        return jsonify({"error": "No file part 'profilePicture' in the request"}), 400
    
    file = request.files['profilePicture']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and allowed_file(file.filename):
        try:
            # 1. Get file extension and create filename
            file_ext = secure_filename(file.filename).rsplit('.', 1)[1].lower()
            new_filename = f"{user_uid}_profile.{file_ext}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
            
            # 2. Save the image directly without AI processing
            file.save(file_path)
            
            # 3. Create the public URL path
            public_url_path = f"/static/user_uploads/{new_filename}"

            # 4. Update Firestore with the new local URL path
            profile_ref = db.collection(PROFILES_COLLECTION).document(user_uid)
            profile_ref.set({"profilePictureUrl": public_url_path}, merge=True)
            
            return jsonify({
                "message": "Picture uploaded and saved successfully",
                "profilePictureUrl": public_url_path
            }), 200

        except Exception as e:
            print(f"File saving or Firestore update error: {e}")
            return jsonify({"error": "Failed to save file"}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400

# ... (Rest of app.py remains unchanged) ...

if __name__ == "__main__":
    app.run(debug=True, port=5000)
# --- NEW ENDPOINT FOR FILE UPLOAD ---

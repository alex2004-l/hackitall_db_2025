from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import os
# MODIFICARE AICI: Importăm și ImageEnhance
from PIL import Image, ImageEnhance 

import firebase_admin
from firebase_admin import credentials, auth, firestore
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# --- CONFIGURARE ---
UPLOAD_FOLDER = 'static/user_uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Creăm folderul de upload dacă nu există
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Inițializare Firebase
cred = credentials.Certificate("serviceAccountKey.json")
# Verificăm dacă app-ul e deja inițializat (pentru a evita erori la reload în dev)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
PROFILES_COLLECTION = "User"

# Funcție pentru verificarea extensiei fișierului
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- FUNCȚIE NOUĂ: PIXELARE LOCALĂ (GRATUITĂ) ---
def generate_pixel_avatar_ai(image_path, user_uid):
    """
    Algoritm "Retro Cartoon": 
    1. Crește saturația și contrastul.
    2. Reduce rezoluția (Pixelare).
    3. Reduce paleta de culori (Efect 8-bit).
    """
    try:
        print(f"Starting retro-cartoon pixelation for user: {user_uid}")
        
        # 1. Deschide imaginea
        img = Image.open(image_path).convert("RGB")
        
        # --- PASUL A: PRE-PROCESARE (Cartoon Effect) ---
        # Creștem saturația (culori mai vii)
        converter = ImageEnhance.Color(img)
        img = converter.enhance(1.7) # 1.7x mai saturat
        
        # Creștem contrastul (linii mai clare)
        converter = ImageEnhance.Contrast(img)
        img = converter.enhance(1.3) # 1.3x mai contrastant

        # --- PASUL B: PIXELARE (Downscaling) ---
        # 64x64 este ideal pentru un avatar retro
        PIXEL_SIZE = 64 
        img_small = img.resize((PIXEL_SIZE, PIXEL_SIZE), resample=Image.BILINEAR)
        
        # --- PASUL C: REDUCEREA CULORILOR (Palette Reduction) ---
        # Reducem la 16 culori pentru efectul de 8-bit/VGA
        # method=1 (FastOctree) dă rezultate bune pentru desene
        img_quantized = img_small.quantize(colors=16, method=1, dither=Image.Dither.NONE)
        
        # Convertim înapoi la RGB pentru a putea salva
        img_cartoon = img_quantized.convert("RGB")

        # --- PASUL D: UPSCALING (Mărire la loc) ---
        OUTPUT_SIZE = (512, 512)
        img_final = img_cartoon.resize(OUTPUT_SIZE, resample=Image.NEAREST)
        
        # Salvare
        pixel_filename = f"{user_uid}_pixelated.png"
        pixel_path = os.path.join(app.config['UPLOAD_FOLDER'], pixel_filename)
        
        img_final.save(pixel_path)
        
        public_url = f"/static/user_uploads/{pixel_filename}"
        print(f"Pixelation complete: {public_url}")
        
        return pixel_path, public_url

    except Exception as e:
        print(f"Pixelation Error: {e}")
        return None, None

# --- DECORATOR AUTH (Verificare Token Firebase) ---
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


# --- RUTE API ---

@app.route("/profile/init", methods=["POST"])
@firebase_token_required
def init_profile():
    user_uid = request.user["uid"]
    user_email = request.user.get("email", "player")
    print(f"Initializing profile for user: {user_uid}")

    DEFAULT_PIC_PATH = "static/system_defaults/user.jpg" 

    try:
        profile_ref = db.collection(PROFILES_COLLECTION).document(user_uid)
        profile_doc = profile_ref.get()
        
        if not profile_doc.exists:
            # Extragem username din email dacă nu există altul
            default_username = user_email.split("@")[0] if user_email else "ArcadePlayer"

            profile_ref.set({
                "username": default_username,
                "profilePictureUrl": DEFAULT_PIC_PATH,
                "createdAt": firestore.SERVER_TIMESTAMP
            })
            return jsonify({"message": "Profile initialized", "created": True}), 201
        else:
            return jsonify({"message": "Profile already exists", "created": False}), 200

    except Exception as e:
        print(f"Error initializing profile: {e}")
        return jsonify({"error": "Failed to initialize profile"}), 500


@app.route("/profile", methods=["GET"])
@firebase_token_required
def get_profile():
    user_uid = request.user["uid"]
    try:
        profile_ref = db.collection(PROFILES_COLLECTION).document(user_uid)
        profile_doc = profile_ref.get()
        
        profile_data = profile_doc.to_dict() if profile_doc.exists else {}
        
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
    
    if not data:
        return jsonify({"error": "No data provided"}), 400

    update_data = {}
    
    # Validare și actualizare username
    if "username" in data and isinstance(data["username"], str) and data["username"].strip():
        update_data["username"] = data["username"].strip()

    # Validare și actualizare poză (dacă se trimite doar URL-ul)
    if "profilePictureUrl" in data and isinstance(data["profilePictureUrl"], str):
        update_data["profilePictureUrl"] = data["profilePictureUrl"]

    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400

    try:
        profile_ref = db.collection(PROFILES_COLLECTION).document(user_uid)
        profile_ref.set(update_data, merge=True)
        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        print(f"Error updating profile: {e}")
        return jsonify({"error": "Failed to update profile"}), 500


@app.route("/profile/picture", methods=["POST"])
@firebase_token_required
def upload_profile_picture():
    user_uid = request.user["uid"]
    
    # 1. Verificăm dacă utilizatorul a cerut procesare (trimis din Frontend)
    use_ai = request.form.get('use_ai', 'false').lower() == 'true'
    
    # 2. Verificări standard pentru fișier
    if 'profilePicture' not in request.files:
        return jsonify({"error": "No file part 'profilePicture'"}), 400
    
    file = request.files['profilePicture']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and allowed_file(file.filename):
        try:
            # 3. Salvăm imaginea originală temporar pe server
            file_ext = secure_filename(file.filename).rsplit('.', 1)[1].lower()
            original_filename = f"{user_uid}_original.{file_ext}"
            original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
            file.save(original_path)
            
            final_public_url = ""

            if use_ai:
                # 4A. Procesare Pixel Art (LOCAL / FREE)
                print(f"User {user_uid} requested Pixelation processing...")
                
                # Apelăm funcția noastră locală
                local_path, public_url = generate_pixel_avatar_ai(original_path, user_uid)
                
                if public_url:
                    final_public_url = public_url
                else:
                    # Fallback la original dacă pixelarea eșuează din vreun motiv
                    print("Pixelation failed, using original image.")
                    final_public_url = f"/static/user_uploads/{original_filename}"
            else:
                # 4B. Folosim imaginea originală (fără procesare)
                print(f"User {user_uid} uploaded image without processing.")
                final_public_url = f"/static/user_uploads/{original_filename}"

            # 5. Actualizăm URL-ul în Firestore
            profile_ref = db.collection(PROFILES_COLLECTION).document(user_uid)
            profile_ref.set({"profilePictureUrl": final_public_url}, merge=True)
            
            return jsonify({
                "message": "Upload successful",
                "profilePictureUrl": final_public_url,
                "ai_used": use_ai
            }), 200

        except Exception as e:
            print(f"File saving error: {e}")
            return jsonify({"error": "Failed to save file"}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)
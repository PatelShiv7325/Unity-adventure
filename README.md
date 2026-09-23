# Skyline Adventures - booking platform (React + Flask)

Working title. Rename it anywhere you see "Skyline Adventures".

## Run the backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows   (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env         # Mac/Linux: cp .env.example .env
python seed.py                 # creates tables, admin user, sample activities
python run.py                  # http://localhost:5000/api/health
```
Sample admin login: `admin@example.com` / `admin123` (change it).

## Run the frontend
```bash
cd frontend
npm install
copy .env.example .env         # Mac/Linux: cp .env.example .env
npm run dev                    # http://localhost:5173
```

See `STRUCTURE.md` for the folder map and `docs/roadmap.md` for the build steps.

# Unity Adventure Sports - booking platform (React + Flask)

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
Admin account: set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (10+ characters) in `backend/.env` before running `seed.py`.
Without `ADMIN_PASSWORD`, `seed.py` uses a development-only password and prints a warning.
In production (`FLASK_ENV=production`) `ADMIN_PASSWORD` is required.

## Run the frontend
```bash
cd frontend
npm install
copy .env.example .env         # Mac/Linux: cp .env.example .env
npm run dev                    # http://localhost:5173
```

## Run the tests
```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

See `STRUCTURE.md` for the folder map and `docs/roadmap.md` for the build steps.
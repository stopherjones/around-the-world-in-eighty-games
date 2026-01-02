from __future__ import print_function
import os
import gspread
import yaml

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly"
]

CONTINENTS = ["Europe", "Africa"]


def get_credentials():
    print("Working directory:", os.getcwd())

    creds = None

    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "client_secret.json", SCOPES
            )
            creds = flow.run_local_server(port=0)

        with open("token.json", "w") as token:
            token.write(creds.to_json())

    return creds


def get_sheet(tab_name):
    creds = get_credentials()
    gc = gspread.authorize(creds)

    sh = gc.open("Around the World in 80 Games")
    ws = sh.worksheet(tab_name)

    return ws


def transform_rows(rows):
    leaderboard = []
    for row in rows:
        entry = {
            "player": row.get("Players", "").strip(),
            "stops": int(row.get("Stops", 0)),
            "points": int(row.get("Points", 0)),
            "trophies": row.get("Trophies", "").strip(),
        }
        leaderboard.append(entry)
    return leaderboard


def write_yaml(continent, data):
    os.makedirs("_data/leaderboard", exist_ok=True)
    path = f"_data/leaderboard/{continent.lower()}.yml"
    with open(path, "w", encoding="utf-8") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False)


def main():
    for continent in CONTINENTS:
        print(f"Processing {continent}...")
        ws = get_sheet(continent)

        rows = ws.get_all_records(
            expected_headers=["Players", "Stops", "Points", "Trophies"]
        )

        leaderboard = transform_rows(rows)
        write_yaml(continent, leaderboard)

    print("All leaderboards updated.")


if __name__ == "__main__":
    main()

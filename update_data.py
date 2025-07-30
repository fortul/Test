"""
update_data.py
================

This utility script fetches up‑to‑date historical price data for the SPDR® Gold Shares ETF (ticker: GLD)
using the `yfinance` library and writes it to a JSON file. The resulting file can be served by the
website to power the interactive chart on gold.html.

Usage:

    python update_data.py

The script will download daily closing prices from the earliest available date through the current day
and save them into ``data/gld_data.json`` relative to the repository root. Each record in the JSON
array is an object with two fields: ``date`` (ISO 8601 date string) and ``close`` (closing price).

Note:
    To run this script you need network access and the `yfinance` package installed. Install it via
    ``pip install yfinance``. If you schedule this script to run daily (for example via a cron job on
    a web server), the local dataset will stay current.

"""

import json
import os
import datetime as dt
try:
    import yfinance as yf
except ImportError as e:
    raise SystemExit("The yfinance package is required. Install it with 'pip install yfinance'.")


def fetch_gld_data() -> list:
    """Download historical GLD data and return a list of dicts with 'date' and 'close'."""
    # Download daily data for the maximum available period
    ticker = yf.Ticker('GLD')
    df = ticker.history(start="2004-11-18", interval="1d")  # GLD launched Nov 18 2004
    # Reset index to get dates
    df = df.reset_index()
    records = []
    for _, row in df.iterrows():
        # Skip rows with missing close price
        if row['Close'] is None or not isinstance(row['Close'], (int, float)):
            continue
        # Convert to iso date string
        date_str = row['Date'].date().isoformat()
        close = round(float(row['Close']), 2)
        records.append({"date": date_str, "close": close})
    return records


def main():
    records = fetch_gld_data()
    output_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'gld_data.json')
    with open(output_path, 'w') as f:
        json.dump(records, f)
    print(f"Saved {len(records)} records to {output_path}")


if __name__ == '__main__':
    main()
import gzip
import tempfile
from io import StringIO

import boto3
import carto2gpd
import click
import geopandas as gpd
import pandas as pd
from dotenv import find_dotenv, load_dotenv
from loguru import logger

from . import DATA_YEARS

# Columns to save
COLUMNS = [
    "latitude",
    "longitude",
    "timestamp",
    "fine",
    "violation_location_zip",
    "dayofweek",
    "hour",
    "violation_description",
    "issuing_agency",
    "location",
]


def add_zip_codes(df):

    # ZIP codes
    zip_codes = gpd.read_file(
        "https://opendata.arcgis.com/datasets/b54ec5210cee41c3a884c9086f7af1be_0.geojson"
    )[["CODE", "geometry"]].rename(columns={"CODE": "violation_location_zip"})

    # Convert to geopandas
    gdf = gpd.GeoDataFrame(
        df,
        geometry=gpd.points_from_xy(df["longitude"], df["latitude"]),
        crs="EPSG:4326",
    )

    # Merged
    merged = gpd.sjoin(
        gdf.drop(columns=["violation_location_zip"]),
        zip_codes,
        predicate="within",
    ).drop(columns=["index_right"])

    return merged


def _download_annual_data(year):
    """Download data from CARTO for a specific year"""

    url = "https://phl.carto.com/api/v2/sql"
    table_name = "parking_violations"
    where = f"issue_datetime >= '{year}-01-01' and issue_datetime <= '{year}-12-31'"

    return carto2gpd.get(url, table_name, where=where)


def _clean_data(df):
    """Clean data."""

    # Add new columns
    df = df.assign(
        issue_datetime=lambda df_: pd.to_datetime(df_.issue_datetime),
        month=lambda df_: df_.issue_datetime.dt.month,
        year=lambda df_: df_.issue_datetime.dt.year,
        day=lambda df_: df_.issue_datetime.dt.day,
        dayofweek=lambda df_: df_.issue_datetime.dt.dayofweek,
        hour=lambda df_: df_.issue_datetime.dt.hour,
        short_desc=lambda df_: df_.violation_desc.str.slice(0, 10).str.strip(),
        timestamp=lambda df_: df_.issue_datetime.dt.strftime("%Y-%m-%d %H:00:00"),
    )

    # Count freq of descriptions
    sizes = df.groupby("short_desc").size().sort_values()

    # get the top N violation descriptions
    N = 25
    categories = {}
    for val in sizes.index[-N:]:
        for desc in df["violation_desc"].unique():
            if desc.startswith(val):
                d = desc.replace("CC", "")
                d = d.replace("HP", "HANDICAP")
                d = d.replace("VEH", "VEHICLE")
                d = d.strip()
                categories[val] = d
                break

    # Save top N, else set to OTHER
    df["violation_desc"] = df["short_desc"].map(
        lambda x: categories[x] if x in categories else "OTHER"
    )

    # Fix issuing agency names
    df["issuing_agency"] = df["issuing_agency"].replace(
        {"HOUSIN": "HOUSING", "POST O": "POST OFFICE", "FAIRMN": "FAIRMOUNT"}
    )

    # Rename columns
    return df.rename(
        columns={
            "lat": "latitude",
            "lon": "longitude",
            "zip_code": "violation_location_zip",
            "violation_desc": "violation_description",
        }
    )


@click.command()
def main():
    """
    Upload the data to AWS, either to the staging
    or production CSV file.

    While testing the interactive mode, upload data to the staging
    spreadsheet first. When ready to go live, upload the data
    to the production spreadsheet.
    """

    # Load the credentials
    load_dotenv(find_dotenv())

    # Initialize the s3 resource
    s3 = boto3.client("s3")
    BUCKET = "parking-jawn"

    for year in DATA_YEARS:

        logger.info(f"Downloading data for {year}")
        df = _download_annual_data(year)

        logger.info("Cleaning data")
        df = _clean_data(df)

        # Add the zip code data
        df = add_zip_codes(df)

        # Upload monthly data
        for month in sorted(df["month"].unique()):

            logger.info(f"Uploading data for {year}-{month}")

            # Get data for this month
            df_month = df.query(f"month == {month}")[COLUMNS].dropna()

            # Compress JSON
            json_str = df_month.to_json(orient="records") + "\n"
            json_bytes = json_str.encode("utf-8")

            filename = f"{year}-{month}.json"
            with tempfile.TemporaryDirectory() as tmpdir:
                tmpfile = f"{tmpdir}/{filename}"
                with gzip.open(tmpfile, "w") as fout:
                    fout.write(json_bytes)

                # Upload to s3
                s3.upload_file(
                    tmpfile,
                    BUCKET,
                    filename,
                    ExtraArgs={
                        "ContentType": "application/json",
                        "ContentEncoding": "gzip",
                        "ACL": "public-read",
                    },
                )

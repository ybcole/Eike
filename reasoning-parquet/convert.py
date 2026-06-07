import pandas as pd
import os

# List of the Parquet files you downloaded
files = ['train.parquet', 'test.parquet', 'validation.parquet']

for file in files:
    # Check if the file actually exists in the folder
    if os.path.exists(file):
        print(f"Reading {file}...")
        
        # Load the Parquet file into a Pandas DataFrame
        df = pd.read_parquet(file)
        
        # Define the output filename
        output_name = file.replace('.parquet', '.json')
        
        # Convert to JSON. 'records' makes it a standard JavaScript array of objects
        df.to_json(output_name, orient='records', indent=2)
        
        print(f"✅ Successfully converted -> {output_name}")
    else:
        print(f"❌ File not found: {file}. Make sure it is in the same folder as this script.")
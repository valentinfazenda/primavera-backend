import pandas as pd
from pymongo import MongoClient, UpdateOne

### Indicators ###

def calculate_sma(df, window):
    """Calculate Simple Moving Average."""
    df[f'SMA_{window}'] = df['Close'].rolling(window=window).mean()

def calculate_bollinger_bands(df, window):
    """Calculate Bollinger Bands."""
    if window > 1:
        middle = df['Close'].rolling(window=window).mean()
        std = df['Close'].rolling(window=window).std()
        
        df[f'Middle_BB_{window}'] = middle
        df[f'Upper_BB_{window}'] = middle + 2 * std
        df[f'Lower_BB_{window}'] = middle - 2 * std

def calculate_macd(df):
    """Calculate Moving Average Convergence Divergence (MACD) and its signal line."""
    df['MACD'] = df['Close'].ewm(span=12, adjust=False).mean() - df['Close'].ewm(span=26, adjust=False).mean()
    df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()

def calculate_rsi(df):
    """Calculate Relative Strength Index (RSI)."""
    delta = df['Close'].diff(1)
    gain = delta.where(delta > 0, 0).rolling(window=14).mean()
    loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
    RS = gain / loss
    df['RSI'] = 100 - (100 / (1 + RS))

def calculate_variation(df):
    """Calculate % variation."""
    df['Variation'] = 100 * ((df['Close'] - df['Open']) / df['Open'])

### Dataframe Creation ###
def create_dataframe(df, symbol, collection):
    """Create dataframe and update MongoDB with processed data for each symbol."""
    
    df = df.copy()
    
    # Convert columns to numeric types
    df['Open'] = pd.to_numeric(df['Open'])
    df['High'] = pd.to_numeric(df['High'])
    df['Low'] = pd.to_numeric(df['Low'])
    df['Close'] = pd.to_numeric(df['Close'])

    # Calculating indicators
    for window in [1, 2, 5, 10, 15, 20]:
        calculate_sma(df, window)
        calculate_bollinger_bands(df, window)
    
    calculate_macd(df)
    calculate_variation(df)
    calculate_rsi(df)
    
    df = df.dropna()
    
    # Prepare bulk update operations
    operations = []
    for _, row in df.iterrows():
        query = {"name": symbol, "date": row["Date"]}
        update = {
            "$set": {
                "sma_1": row.get("SMA_1"),
                "sma_2": row.get("SMA_2"),
                "sma_5": row.get("SMA_5"),
                "sma_10": row.get("SMA_10"),
                "sma_15": row.get("SMA_15"),
                "sma_20": row.get("SMA_20"),
                "middle_bb_1": row.get("Middle_BB_1"),
                "upper_bb_1": row.get("Upper_BB_1"),
                "lower_bb_1": row.get("Lower_BB_1"),
                "middle_bb_2": row.get("Middle_BB_2"),
                "upper_bb_2": row.get("Upper_BB_2"),
                "lower_bb_2": row.get("Lower_BB_2"),
                "middle_bb_5": row.get("Middle_BB_5"),
                "upper_bb_5": row.get("Upper_BB_5"),
                "lower_bb_5": row.get("Lower_BB_5"),
                "middle_bb_10": row.get("Middle_BB_10"),
                "upper_bb_10": row.get("Upper_BB_10"),
                "lower_bb_10": row.get("Lower_BB_10"),
                "middle_bb_15": row.get("Middle_BB_15"),
                "upper_bb_15": row.get("Upper_BB_15"),
                "lower_bb_15": row.get("Lower_BB_15"),
                "middle_bb_20": row.get("Middle_BB_20"),
                "upper_bb_20": row.get("Upper_BB_20"),
                "lower_bb_20": row.get("Lower_BB_20"),
                "macd": row.get("MACD"),
                "signal_line": row.get("Signal_Line"),
                "rsi": row.get("RSI"),
                "variation": row.get("Variation")
            }
        }
        operations.append(UpdateOne(query, update, upsert=True))
    
    if operations:
        # Perform all updates in one command
        result = collection.bulk_write(operations)
        print(f"Updated {result.modified_count} documents.")

    return df

### MAIN ###
def main():
    client = MongoClient('mongodb+srv://valentinfazenda:Rk2Hr4qVEteDNBhu@clusterusers.lf7lxyn.mongodb.net/primavera-ai?retryWrites=true&w=majority&appName=ClusterUsers')
    db = client['primavera-ai']
    historical_data_collection = db['historicaldatas']
    
    
    symbols = historical_data_collection.distinct('name') 
    for symbol in symbols:
        print(f"------------------ Process Symbol: {symbol} ------------------")
        cursor = historical_data_collection.find({'name': symbol})
        data = list(cursor)
        if data:
            df = pd.DataFrame(data)
            df = df.rename(columns={
                'date': 'Date', 
                'open': 'Open', 
                'high': 'High', 
                'low': 'Low', 
                'close': 'Close'
            })
            df['Date'] = pd.to_datetime(df['Date'])
            df.sort_values('Date', inplace=True)
            create_dataframe(df, symbol, historical_data_collection)

if __name__ == "__main__":
    main()
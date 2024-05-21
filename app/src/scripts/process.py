import pandas as pd
import os

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

def create_dataframe(df, symbol):
    """Create dataframe and save processed data for each symbol."""
    
    # Make a copy of the DataFrame to avoid SettingWithCopyWarning
    df = df.copy()
    
    # Calculating indicators
    for window in [1, 2, 5, 10, 15, 20]:
        calculate_sma(df, window)
        calculate_bollinger_bands(df, window)
    
    calculate_macd(df)
    calculate_variation(df)
    calculate_rsi(df)
    
    df = df.dropna()
    
    os.makedirs(f'../ressources/data/processed/processed_data_{symbol}', exist_ok=True)
    df.to_csv(f'../ressources/data/processed/processed_data_{symbol}/processed_data_{symbol}.csv', index=False)
    return df

### MAIN ###
def main():
    df = pd.read_csv("../ressources/data/crypto.csv", index_col=False)
    symbols = df['Symbol'].unique()
    for symbol in symbols:
        print(f"------------------ Process Symbol: {symbol}------------------")
        create_dataframe(df[df['Symbol'] == symbol], symbol)

if __name__ == "__main__":
    main()
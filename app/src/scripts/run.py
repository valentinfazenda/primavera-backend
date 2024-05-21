import pandas as pd
import numpy as np
from keras.models import load_model
from sklearn.preprocessing import MinMaxScaler

### Load and preprocess input data ###

def load_and_preprocess_data(filepath, features):
    """Load and preprocess data from a CSV file."""
    df = pd.read_csv(filepath)
    df.fillna(method='ffill', inplace=True)  # Fill missing values

    # Feature scaling
    scaler = MinMaxScaler()
    df[features] = scaler.fit_transform(df[features])

    return df

### Predict using the LSTM model ###

def predict(model_path, input_data, features):
    """Load model and predict using the processed input data."""
    model = load_model(model_path)
    input_data = input_data[features].values[-1].reshape((1, 1, len(features)))

    # Make prediction
    predictions = model.predict(input_data)
    
    return predictions

### Main execution function ###

def main():
    # Define the path to the input data and the model
    input_filepath = '../ressources/data/processed/processed_data_BTC/processed_data_BTC.csv'
    model_path = '../ressources/models/model_BTC.h5'

    # Define the features used by the model (same as training)
    features = ['Close', 'High', 'Low', 'Open', 'SMA_1', 'SMA_2', 'SMA_5', 'SMA_10', 'SMA_15', 'SMA_20', 
                'Middle_BB_2', 'Middle_BB_5', 'Middle_BB_10', 'Middle_BB_15', 'Middle_BB_20', 
                'Upper_BB_2', 'Upper_BB_5', 'Upper_BB_10', 'Upper_BB_15', 'Upper_BB_20', 
                'Lower_BB_2', 'Lower_BB_5', 'Lower_BB_10', 'Lower_BB_15', 'Lower_BB_20', 
                'MACD', 'Signal_Line', 'RSI']

    # Load and preprocess data
    input_data = load_and_preprocess_data(input_filepath, features)

    # Perform predictions
    predictions = predict(model_path, input_data, features)

    # Print or save the predictions
    print("Predictions:")
    print(predictions)

if __name__ == "__main__":
    main()

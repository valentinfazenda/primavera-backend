import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
from keras.models import Sequential
from keras.callbacks import EarlyStopping, ModelCheckpoint
from keras.layers import Dense, LSTM, Dropout, Input
import tensorflow as tf
from tensorflow.python.client import device_lib

def prepare_data(df, features):
    """Normalize feature data and split into training and testing sets."""
    scaler = MinMaxScaler()
    df[features] = scaler.fit_transform(df[features])

    X = df[features]
    y = df['Variation']
    return train_test_split(X, y, test_size=0.2, random_state=42)

def build_model(input_shape):
    """Build a Sequential LSTM model."""
    model = Sequential([
        Input(shape=input_shape),
        LSTM(100, return_sequences=True),
        Dropout(0.2),
        LSTM(50),
        Dropout(0.2),
        Dense(25),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

def train_model(X_train, y_train, model, symbol):
    """Fit the model to the training data."""
    model_path = f'../ressources/models/model_{symbol}.h5'
    
    early_stopping = EarlyStopping(monitor='val_loss', patience=500, restore_best_weights=True)
    model_checkpoint = ModelCheckpoint(model_path, monitor='val_loss', save_best_only=True)

    model.fit(X_train, y_train, batch_size=64, epochs=1000, validation_split=0.2, 
              callbacks=[early_stopping, model_checkpoint], verbose=0)
    model.save(model_path)
    print(f'Model saved to {model_path}')

def evaluate_model(model, X_test, y_test):
    """Evaluate the model's performance and make predictions."""
    predictions = model.predict(X_test)
    loss = model.evaluate(X_test, y_test)
    r2 = r2_score(y_test, predictions)
    print(f'Loss: {loss}')
    print(f'R²: {r2}')
    return y_test, predictions

def reshape_data(X):
    """Reshape X for LSTM model."""
    return X.values.reshape((X.shape[0], 1, X.shape[1]))

def process_symbol(df, symbol, features):
    """Process by symbol."""
    X_train, X_test, y_train, y_test = prepare_data(df, features)
    X_train, X_test = map(reshape_data, [X_train, X_test])
    
    model = build_model((X_train.shape[1], X_train.shape[2]))
    train_model(X_train, y_train, model, symbol)
    actuals, predictions = evaluate_model(model, X_test, y_test)

    print("\nFirst 10 Predictions:")
    for act, pred in zip(actuals.values.flatten()[:10], predictions.flatten()[:10]):
        print(f'Predicted: {pred:.4f}, Actual: {act:.4f}')
    
    predictions_df = pd.DataFrame({
        'real': actuals.values.flatten(),
        'pred': predictions.flatten()
    })
    predictions_df.to_csv(f'../ressources/data/predictions/predictions_{symbol}.csv', index=False)
    print(f'Predictions saved to ../ressources/data/predictions/predictions_{symbol}.csv')

def main():
    print(device_lib.list_local_devices())
    df = pd.read_csv("../ressources/data/crypto.csv", index_col=False)
    symbols = df['Symbol'].unique()
    
    features = ['Close', 'High', 'Low', 'Open', 'SMA_1', 'SMA_2', 'SMA_5', 'SMA_10', 'SMA_15', 'SMA_20', 'Middle_BB_2', 'Middle_BB_5', 'Middle_BB_10', 'Middle_BB_15', 'Middle_BB_20', 'Upper_BB_2', 'Upper_BB_5', 'Upper_BB_10', 'Upper_BB_15', 'Upper_BB_20', 'Lower_BB_2', 'Lower_BB_5', 'Lower_BB_10', 'Lower_BB_15', 'Lower_BB_20', 'MACD', 'Signal_Line', 'RSI']
    for symbol in symbols:
        df_symbol = pd.read_csv(f'../ressources/data/processed/processed_data_{symbol}/processed_data_{symbol}.csv', index_col=False)
        print(f"------------------Symbol: {symbol}------------------")
        process_symbol(df_symbol, symbol, features)

if __name__ == "__main__":
    main()

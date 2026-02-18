#!/usr/bin/env python3
"""
Prophet Forecasting Script for Alimento Restaurant Demand
Reads historical data from stdin, runs Prophet model, outputs forecast to stdout
"""

import sys
import json
import pandas as pd
from prophet import Prophet
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings('ignore')

def run_forecast():
    try:
        # Read input from stdin (sent by Node.js)
        input_data = sys.stdin.read()
        config = json.loads(input_data)
        
        historical_data = config.get('historicalData', [])
        forecast_days = config.get('forecastDays', 7)
        
        # Validate data - need at least 2 data points for Prophet
        if not historical_data or len(historical_data) < 2:
            raise ValueError(f"Insufficient historical data: need minimum 2 points, got {len(historical_data)}")
        
        # Convert to DataFrame
        df = pd.DataFrame(historical_data)
        df['ds'] = pd.to_datetime(df['ds'])
        df = df.sort_values('ds').reset_index(drop=True)
        
        # Validate we have valid data
        if df.empty or df['y'].isnull().all():
            raise ValueError("No valid forecast values in historical data")
        
        # Initialize Prophet model
        # Use more conservative settings for smaller datasets
        model = Prophet(
            yearly_seasonality=len(df) >= 365,  # Only if 1+ year of data
            weekly_seasonality=len(df) >= 14,   # Only if 2+ weeks of data
            daily_seasonality=False,             # Requires hourly data
            seasonality_mode='additive',
            interval_width=0.95,
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10.0,  # Reduce seasonality impact on small datasets
        )
        
        # Fit the model
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            model.fit(df[['ds', 'y']])
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=forecast_days)
        
        # Generate forecast
        forecast = model.predict(future)
        
        # Extract only future dates (not historical)
        future_forecast = forecast[forecast['ds'] > df['ds'].max()].copy()
        
        # Format output
        result = []
        for idx, row in future_forecast.iterrows():
            result.append({
                'ds': row['ds'].strftime('%Y-%m-%d'),
                'yhat': round(float(row['yhat']), 2),
                'yhat_lower': round(float(row['yhat_lower']), 2),
                'yhat_upper': round(float(row['yhat_upper']), 2),
                'trend': round(float(row['trend']), 2),
                'weekly': round(float(row.get('weekly', 0)), 2) if 'weekly' in row else 0,
            })
        
        # Output as JSON
        print(json.dumps(result))
        sys.exit(0)
        
    except Exception as e:
        error_output = json.dumps({
            'error': str(e),
            'type': type(e).__name__
        })
        print(error_output, file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    run_forecast()

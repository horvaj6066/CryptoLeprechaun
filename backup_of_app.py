import os
import pandas as pd
import numpy as np
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from flask import Flask, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
#################################################
# Database Setup
#################################################
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///./db/data.sqlite" #this is path to the sqlite file
# db = SQLAlchemy(app)
# DATABASE_URL will contain the database connection string:
#app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgres://ezcxwpwucotggc:f366b3cf7ed5c8f76736ace195783d7396ed39e2b7941ad5316cc29d514ecc72@ec2-174-129-227-146.compute-1.amazonaws.com:5432/d5eljethbtap0k') or "sqlite:///./db/data.sqlite"
# Connects to the database using the app config
db = SQLAlchemy(app)
# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(db.engine, reflect=True)
# print out Table Names
print("Database Table Names")  #table name is 'btc'
print(db.engine.table_names())
# make sure our table has a primary key otherwise it won't work with SQLAlchemy
print("Database Tables that have Keys")
print(Base.classes.keys())
# Save references to the table
#BTC_Data = Base.classes.btc  #think refers to btc table, THIS IS PROBLEM LINE 
#print(BTC_Data)
BTC_panda = pd.read_csv("3Y_BTC.csv")  #upload the price data file from google drive for updating with the current prices 
BTC_json = BTC_panda.to_json()

print("btc json and panda from csv")
print(BTC_json)
print(BTC_panda)

#BTC_panda.to_sql('btc', con=db.engine, if_exists='replace') #con=db.engine

@app.route("/")
def index():
    """Return the homepage."""
    return render_template("index.html")

@app.route("/candlestick/")
def candlestick():
    return render_template("candlestick.html")

@app.route("/project_info/")
def project_info():
    return render_template("project_info.html")

@app.route("/team_info/")
def team_info():
    return render_template("team_info.html")

@app.route("/names")
def names():
    """Return a list of sample names."""
    # Use Pandas to perform the sql query
    stmt = db.session.query(BTC_Data).statement
    df = pd.read_sql_query(stmt, db.session.bind)
    print(df)
    # Return a list of the column names (sample names)
    return jsonify(bitcoin_data)
    #return jsonify(list(df.columns)[2:])

# Need to add in the path for once we select the data
@app.route("/btc_data")
def selected_btcdata():
    # Return the data for the selected dates
    print("LINE 74 from app.py *************")
    sel = [
        BTC_Data.date,
        BTC_Data.open,
        BTC_Data.high,
        BTC_Data.low,
        BTC_Data.close,
        #BTC_Data.volume,
        #BTC_Data.market_cap,
        BTC_Data.unit_volume,
        BTC_Data.bitmex_funding,
        #BTC_Data.rolling_20_d,
        #BTC_Data.date_2,
        #BTC_Data.bitfinex_shorts,
        #BTC_Data.bitfinex_longs,
        #BTC_Data.bitfinex_volume,
        #BTC_Data.total_crypto_cap,
        #BTC_Data.bitcoin_dominance,
    ]

    # results = db.session.query(*sel).filter(BTC_Data.date >= start).filter(BTC_Data <= end).all()
    results = db.session.query(*sel).all()
    

    # Create a dictionary entry for each row of metadata
    bitcoin_data = {}
    # for result in results:
    #     bitcoin_data.update(result)
    # for result in results:
    #     for i in result:
    #         bitcoin_data["date"] = result[0]
    #         bitcoin_data["open"] = results[result[1]]
    #         bitcoin_data["high"] = results[result[2]]
    #         bitcoin_data["low"] = results[result[3]]
    #         bitcoin_data["close"] = results[result[4]]
    #         # bitcoin_data["volume"] = results[5]
    #         bitcoin_data["market_cap"] = results[result[6]]
    #         bitcoin_data["unit_volume"] = results[result[7]]
    #         bitcoin_data["rolling_20_d"] = results[result[8]]
    #         bitcoin_data["date_2"] = results[result[9]]
    #         bitcoin_data["bitfinex_shorts"] = results[result[10]]
    #         bitcoin_data["bitfinex_longs"] = results[result[11]]
    #         bitcoin_data["bitfinex_volume"] = results[result[12]]
    #         bitcoin_data["total_crypto_cap"] = results[result[13]]
    #         # bitcoin_data["bitcoin_dominance"] = results[result[14]]
####
    date = [result[0] for result in results]
    Open = [result[1] for result in results]
    high = [result[2] for result in results]
    low = [result[3] for result in results]
    close = [result[4] for result in results]
    # volume = [result[5] for result in results]
    #market_cap = [result[6] for result in results]
    unit_volume = [result[5] for result in results]
    bitmex_funding = [result[6] for result in results]
    #rolling_20_d = [result[8] for result in results]
    #date_2 = [result[9] for result in results]
    #bitfinex_shorts = [result[10] for result in results]
    #bitfinex_longs = [result[11] for result in results]
    #bitfinex_volume = [result[12] for result in results]
    #total_crypto_cap = [result[13] for result in results]
    #bitcoin_dominance = [result[14] for result in results]
    
    bitcoin_data = [{
        "date": date,
        "open": Open,
        "high": high,
        "low": low,
        "close": close,
        # "volume": volume,
        #"market_cap": market_cap,
        "unit_volume": unit_volume,
        "bitmex_funding": bitmex_funding,
        "rolling_20_d": rolling_20_d,
        #"date_2": date_2,
        #"bitfinex_shorts": bitfinex_shorts,
        #"bitfinex_longs": bitfinex_longs,
        #"bitfinex_volume": bitfinex_volume,
        #"total_crypto_cap": total_crypto_cap,
        #"bitcoin_dominance": bitcoin_dominance
    }]
####
    # for i in len(date):
        # date = result[0]
        # Open = result[1]
        # high = result[2]
        # low = result[3]
        # close = result[4]
        # # volume = [result[5]]
        # market_cap = result[6]
        # unit_volume = result[7]
        # rolling_20_d = result[8]
        # date_2 = result[9]
        # bitfinex_shorts = result[10]
        # bitfinex_longs = result[11]
        # bitfinex_volume = result[12]
        # total_crypto_cap = result[13]
        # # bitcoin_dominance = [result[14] for result in results]
    
        # bitcoin_data_result = {
        #     "date": date[i],
        #     "open": Open[i],
        #     "high": high[i],
        #     "low": low[i],
        #     "close": close[i],
        #     # "volume": volume[i],
        #     "market_cap": market_cap[i],
        #     "unit_volume": unit_volume[i],
        #     "rolling_20_d": rolling_20_d[i],
        #     "date_2": date_2[i],
        #     "bitfinex_shorts": bitfinex_shorts[i],
        #     "bitfinex_longs": bitfinex_longs[i],
        #     "bitfinex_volume": bitfinex_volume[i],
        #     "total_crypto_cap": total_crypto_cap[i],
        #     # "bitcoin_dominance": bitcoin_dominance[i],
        # }

        # bitcoin_data.update(bitcoin_data_result)
    #print(bitcoin_data)
    print("LINE 193 from app.py *************before return")
    return jsonify(bitcoin_data)
    #return BTC_json #return jsonify(BTC_panda) 

if __name__ == "__main__":
    app.run()

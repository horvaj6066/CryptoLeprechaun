# Dependencies for bitmex 
#pip install bitmex #if not installed uncomment 
from bitcoin_rnn import predict 
from scrape_API import scrape 

import os
import numpy as np
import pandas as pd

from flask import Flask, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

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

@app.route("/scrape")
#this will call the bitmex api/coinmarket cap scrape and update the csv file with latest data
def selected_scrape():
    print("*****************calling scrape from app.py ln 35 **************************")
    scrape()
    print("*****************returned from scrape function, this is where we would call predioct**************************")
    predict()
    print("*****************returned from predict function**************************")
    #return to app.py and call makeResponsive which will update charts 
    return jsonify("csv file updated with latest")


@app.route("/btc_data")
def selected_btcdata():
    # Return the data for the selected dates
    # print(bitcoin_data)
    #return jsonify(bitcoin_data)
    bitcoin=pd.read_csv("price_predict_and_hist_data.csv")  #loads from cryptoleprechaun directory
    print("from flask app btc panda here is bitcoin, next is jsonification *****************\n")
    new_bitcoin=bitcoin.to_json()
    
    return new_bitcoin

if __name__ == "__main__":
    app.run()

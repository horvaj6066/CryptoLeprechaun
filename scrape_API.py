def scrape():
   #this uploads the file with the OHLC pricing, volume and bitmex funding and does APIs and scrapes to update for the missing days
   # Dependencies for bitmex 
   #!pip install bitmex #if not installed uncomment 
   import bitmex
   import requests
   import json
   import pandas as pd
   import numpy as np
   
#scraping coinmarketcap after the daily close plus getting bitmex funding rate and adding to our OLCHV time series 
#first import our modules
   from requests import Request, Session
   import requests
   from requests.exceptions import ConnectionError, Timeout, TooManyRedirects
   from bs4 import BeautifulSoup as bs 
   print("entering scrape function") # we got past this 
   #upload the BTC data from local drive 
   #filename='3Y_BTC.csv'
   filename='price_predict_and_hist_data.csv'

   data = pd.read_csv(filename)  #upload the price data file from google drive for updating with the current prices 

   #datetime module for the timer and coinmarket cap scrape 
   import datetime
   import time
   from datetime import timedelta 
   #from datetime import datetime
   today = datetime.datetime.now()

   start_date=str((data.iloc[-1,0])) #start date is last day of the data panda 
   start_date=pd.to_datetime(start_date)
   #start_date=(start_date + timedelta(days=1)) # start with the day after the last day in the csv file  
   start_date=start_date.strftime("%Y%m%d") #correct format for coinmarketcap scrape 
   #problem is 32 I think 
   API_KEY_TEST = 'UYXCTw4rjO7rqpPUR8YtMjtg'
   API_SECRET_TEST = 'Your Key Here'

   #**************Bitmex API call starts here 
   # Set-up & connect to test BitMEX environment

   test_client = bitmex.bitmex(test=True, api_key=API_KEY_TEST, api_secret=API_SECRET_TEST)
   # set symbol and number of results to pull
   start_count = range(0, 500, 500) #2nd argument was 3000 but I'm only doing one slug of 500, can't do less 

   Combined_Funding_data_df = pd.DataFrame(columns=['fundingInterval','fundingRate','fundingRateDaily','symbol','timestamp'])

   for i in start_count:
      # filters
      target_symbol = 'XBTUSD'
      start = i

      # set up a parameters dictionary
      params = {
         'symbol': target_symbol,
         'key': API_KEY_TEST,
         'count': 500,
         'start': start,
         'reverse': True
      }
      # base url
      base_url = 'https://www.bitmex.com/api/v1/funding'

      # run a request using our params dictionary
      response = requests.get(base_url, params=params)

      # convert response to json
      Funding_data = response.json()

      # create data frame
      Funding_data_df = pd.DataFrame(Funding_data)

      Combined_Funding_data_df = Combined_Funding_data_df.append(Funding_data_df, sort=True,ignore_index=True)
      # the sum of the funding rate peCombined_Funding_data_dfr 24 hour period is the latest funding rate * 3  

      Combined_Funding_data_df = Combined_Funding_data_df.iloc[::-1] 
      
   #massage the panda with the bitmex data for being combined with the coinmarketcap price data
   date_list=[]
   funding_rate=[]
   new_df = pd.DataFrame(columns=['date','bitmex_funding']) #to hold the funding rate and date for desired time frame 

   for j in range(0, 500): #we downloaded 500 elements from bitmex, 3 for each day for BTC 
      date=Combined_Funding_data_df.iloc[j,4] #pull the date
      date=date.replace("-","") #remove the '-' from the date 
      funding_interval=date[9:11] #just need the funding interval, 3 per day 
      date=date[0:8] #we only need the yearmonthday
      date=pd.to_datetime(date) #convert to date time object 
      date=date.strftime("%Y%m%d") #correct format for coinmarketcap scrape 
      if date >= start_date: #if it's within our update window 
            if funding_interval == '20':
               date_list.append(date)
               funding_rate.append(Combined_Funding_data_df.iloc[j,1])

   new_df['date']=date_list
   new_df['bitmex_funding']=funding_rate
   print("new_df from scrape line 96\n", new_df)

   #**********COINMARKETCAP SCRAPE************setting up the start end dates in right format using datetime 
   #start_date=   #format is YYYYMMDD no other characters 
   #end_date=  #format is YYYYMMDD no other characters 
   #WE ARE ONLY DOING ONE DAY HERE 
   #day_ago=(today - timedelta(days=1))
   #year_ago=(today - timedelta(days=1095))  

   #start_date=day_ago.strftime("%Y%m%d") #for one day scrape, we already have the start date from earlier 
   end_date=today.strftime("%Y%m%d")
   print("start date, end date for URL:", start_date, end_date)
   Date = pd.date_range(start_date, end_date, freq='1D').strftime('%Y%m%d') #NOTE this is without hyphens!!!

   #url for the scrape for aggregate pricing and volume 
   agg_vol_url='https://coinmarketcap.com/currencies/bitcoin/historical-data/?start='+start_date+'&end='+end_date
   row=[] #temp variable to hold each line of the table before appended to vol_df
   latest_scrape_date=""
   
   #do the actual scrape, below is scrape loop we need to ensure the site has been updated to the days clsoe  
   #while loop is to ensure that the coinmarketcap.com data is updated to today's trade date shortly after 5PM PT
   while(latest_scrape_date != end_date):  #end_date is actually today's date so comparing this to the scrape 
      time.sleep(125) #if not the correct date wait 125 seconds
      response = requests.get(agg_vol_url).text
      soup=bs(response,'html') #C:\Users\Jon P Horvath\Documents\Bootcamp_HW\Project_Work\Machine_Learning\cryptoleprechaun\scrape_API.py:115: UserWarning: No parser was explicitly specified, so I'm using the best available HTML parser for this system ("lxml"). This usually isn't a problem, but if you run this code on another system, or in a different virtual environment, it may use a different parser and behave differently.#The code that caused this warning is on line 115 of the file C:\Users\Jon P Horvath\Documents\Bootcamp_HW\Project_Work\Machine_Learning\cryptoleprechaun\scrape_API.py. To get rid of this warning, pass the additional argument 'features="lxml"' to the BeautifulSoup constructor.
      my_table = soup.find('table',class_='table')
      vol_df = pd.DataFrame()  #get a dataframe ready to hold the data and then pull it out 
      for link in my_table.find_all('tr'):  #this is the scraping loop 
         name = link.find('td') #pulling out the first line with date 
         item=link.text
         row=pd.Series(item.split('\n')) #the tables delimiter is new line \n 
         vol_df=vol_df.append(row, ignore_index=True) #append to the panda 
      latest_scrape_date=str((vol_df.iloc[1,1])) #this is the latest date in the new scraped panda 
      latest_scrape_date=pd.to_datetime(latest_scrape_date) #make a date time object  
      latest_scrape_date = latest_scrape_date.strftime("%Y%m%d") #format for comparison
      print("latest_scrape_date, end_date ",latest_scrape_date, end_date) 
      print(vol_df)
      #latest_scrape_date=end_date #for when you miss a scrape **********************COMMENT OUT*************
      
   
   print("voldf from line 138\n",vol_df) #this was all NaaNs 

   #massage the scraped panda to make it look like the csv we uploaded      
   vol_df=vol_df.iloc[1:,1:8]
   vol_df.columns = ['date','open','high','low','close','Volume','MarketCap']
   vol_df['Volume']=vol_df['Volume'].str.replace(',','') # get rid of commas to change to number
   vol_df['MarketCap']=vol_df['MarketCap'].str.replace(',','') # get rid of commas to change to number
   vol_df['close'] = vol_df['close'].astype(float)
   vol_df['Volume'] = vol_df['Volume'].astype(np.int64) #convert from string to int for calcs 
   vol_df['MarketCap'] = vol_df['MarketCap'].astype(np.int64) #convert from string to float for calcss 
   vol_df['unit_volume'] = vol_df['Volume']/vol_df['close']/1000    
   vol_df.drop(['Volume', 'MarketCap'], inplace=True, axis=1) #drop volume and market cap 
   vol_df = vol_df.iloc[::-1] 
 
   print("voldf from line 143 after some massaging\n",vol_df) #

   if new_df['date'].size>vol_df['date'].size:  #if the bitmex funding df (new_df) is larger than the vol_df
      new_df=new_df[1:] # drop first r0w (not the last row) 
   ##print(new_df['date'].size, vol_df['date'].size)

   new_df=new_df.reset_index() #have to reset these indexes as one is upside down 
   vol_df=vol_df.reset_index()
   vol_df=vol_df.drop('index', axis=1) #drop one index 

   vol_df.insert(6,'bitmex_funding',new_df['bitmex_funding']) #inserted as 6th column 
   print("voldf from line 154 after inserting bitmex funding as 6th column:\n",vol_df) #
   vol_df=vol_df.drop('date', axis=1) #drop the long version of date
   vol_df.insert(0,'date',new_df['date']) #insert date w proper format as first column 
   print("voldf l 157  after replacing long date with short date:\n",vol_df) #looking good
   #print("data********************************l 158 before the append w vol_df:\n",data) 
   # voldf and data looks fine right here 
   #if there is an overlap in dates between vold_df and data then one row needs to be dropped
   if(vol_df.iloc[0,0] == str(data.iloc[-1,0])):
      vol_df=vol_df[1:] #drop first row
      print("dropped first row in vol_df")
   
   data.set_index(["date"], inplace = True, drop = True) #get rid of index so not in the csv file
   vol_df.set_index(["date"], inplace = True, drop = True) #get rid of index so not in the csv file

   data=data.append(vol_df, sort=False) #VERY IMPORTANT the sort=False stops it from sorting the new panda alphabetically
   
   print("at end of scrape, saving data here is data:\n", data) #data looks awful
   #somehow the columns in data got messed up
   data.to_csv(filename) #saving to crypto leprechaun
   time.sleep(5) #trying short timer here as we are about to upload file for predict
   #and we are done!! 

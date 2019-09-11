#Prediction Update - called at 5PM after BTC price update to run the prediction model with the new price
#then it saves it to a csv file that is used to update the charts 
#based on - https://github.com/JerryWei03/DeepCryptocurrency/blob/master/A%20Deep%20Learning%20Approach%20to%20Predicting%20Cryptocurrency%20Prices.ipynb

def predict(): 
    #3 dimensional array as input to LSTM network - 1st is batch size, 2nd is time steps, and third is sequency length
    from keras.models import load_model 
    from keras.models import model_from_json
    from keras.layers.core import Dense, Activation, Dropout
    from keras.layers.recurrent import LSTM
    from keras.layers import Bidirectional
    from keras.models import Sequential
    from sklearn.metrics import mean_squared_error
    import pandas as pd
    import numpy as np 
    import matplotlib.pyplot as plt
    
    #load up and format the data for the model 
    sequence_length=30
    y_column=3
    current_model= "0.5631067961165048"
    path = "C:\\Users\\Jon P Horvath\\Documents\\Bootcamp_HW\\Project_Work\\Machine_Learning\\cryptoleprechaun\\"
    file = "price_predict_and_hist_data.csv"
    #upload from the CSV, first one is simple file                         
    #raw_data = pd.read_csv("C:\\Users\\Jon P Horvath\\Documents\\Bootcamp_HW\\Project_Work\\Machine_Learning\\3Y_BTC.csv", dtype = float).values
    #print(raw_data.shape)
    #raw_data=raw_data[:,1:]

    #here we are going to load up the price predict file, isolate the 7 fields and run the program
    raw_data = pd.read_csv(path+file, dtype = float).values
    print(raw_data.shape)
    raw_data=raw_data[:,1:7] #drops date and last 3 columns
            
    #Change all zeros to the number before the zero occurs
    for x in range(0, raw_data.shape[0]):
        for y in range(0, raw_data.shape[1]):
            if(raw_data[x][y] == 0):
                raw_data[x][y] = raw_data[x-1][y]
    
    #convert the file to a list
    data = raw_data.tolist()
        
    #Convert the data to a 3D array (a x b x c) 
    #Where a is the number of days, b is the window size, and c is the number of features in the data file
    result = []
    for index in range(len(data) - sequence_length):
        result.append(data[index: index + sequence_length])
        
    print("line 49 data length shd be 10821 +-1:", len(data)) #1060 makes sense 
        
    #Normalizing data by going through each window
    #Every value in the window is divided by the first value in the window, and then 1 is subtracted
    d0 = np.array(result)
    dr = np.zeros_like(d0)
    print("line 55")
    dr[:,1:,:] = d0[:,1:,:] / d0[:,0:1,:] - 1
                
    #Keeping the unnormalized prices for Y_test
    #Useful when graphing bitcoin price over time later
    start_num = d0.shape
    start_num=0.9*start_num[0]

    #START needs to EQUAL shape of xtrain, seems to match up to length of training data
    start = round(start_num) # was 910, 927, 933 -REALLY important that this is x-shape split_line #split_line = round(0.9 * dr.shape[0]) WAS hard CODED!!!
    #start = 933 # was 910 -REALLY important that this is x-shape split_line #split_line = round(0.9 * dr.shape[0]) WAS hard CODED!!!
    end = int(dr.shape[0] + 1)
    print("start=", start)
    print("end = dr.shape[0] + 1",end)
        
    #unnormalized_bases = d0[start:end,0:1,20] #20 was where the bitcoin price was in original file 
    unnormalized_bases = d0[start:end,0:1, y_column] #this is the first problem line 
    print("unnormalized bases shape:") 
    print(unnormalized_bases.shape) 
        
    #Splitting data set into training (First 90% of data points) and testing data (last 10% of data points)
    split_line = round(0.9 * dr.shape[0])  #split between training and predict
    training_data = dr[:int(split_line), :]
    print("length training data", len(training_data))
    #Shuffle the data -WHY DO WE SHUFFLE THE DATA IN A TIME SERIES ???
    np.random.shuffle(training_data)
        
    #Training Data
    X_train = training_data[:, :-1]
    Y_train = training_data[:, -1]
    print("xtrain ytrain done")
    Y_train = Y_train[:, y_column] #the 20 is because bitcoin price was 20th column in his data
    print("xtrain ytrain done ln 88")    
    #Testing data
    X_test = dr[int(split_line):, :-1] #split line is just the dividing point for the training data
    Y_test = dr[int(split_line):, (sequence_length-1), :] #was 49 middle and was using 50 seq length 
    Y_test = Y_test[:, y_column] #the 20 is because bitcoin price was 20th column in his data
    print("xtest ytest done ln 93") 
    #Get the day before Y_test's price
    Y_daybefore = dr[int(split_line):, (sequence_length-2), :] #was 48 and was using 50 sequence length 
    Y_daybefore = Y_daybefore[:, y_column] #the 20 is because bitcoin price was 20th column in his data
    print("ln 97 ydaybefore")    
    #Get window size and sequence length
    sequence_length = sequence_length
    window_size = sequence_length - 1 #because the last value is reserved as the y value
    print("ln 101 just about to open model")    
    # Model reconstruction from JSON file
    with open('C:\\Users\\Jon P Horvath\\Documents\\Bootcamp_HW\\Project_Work\\Machine_Learning\\'+current_model+'.json', 'r') as f:
        model = model_from_json(f.read())
    print("line 104")
    # Load weights into the new model
    model.load_weights('C:\\Users\\Jon P Horvath\\Documents\\Bootcamp_HW\\Project_Work\\Machine_Learning\\'+current_model+'.h5')
    print("line 108 model summary:", model.summary())
    y_predict = model.predict(X_test)
    #Create empty 2D arrays to store unnormalized values
    real_y_test = np.zeros_like(Y_test)
    real_y_predict = np.zeros_like(y_predict)

    #unnormalize
    #Fill the 2D arrays with the real value and the predicted value by reversing the normalization process
    for i in range(Y_test.shape[0]):
        y = Y_test[i]
        predict = y_predict[i]
        real_y_test[i] = (y+1)*unnormalized_bases[i] 
        real_y_predict[i] = (predict+1)*unnormalized_bases[i]
    predict=float(real_y_predict[-1])
    print("line 122 latest prediction:", predict)
    raw_data = pd.read_csv(path+file)
    raw_data.iloc[-1,7] = predict #add the latest prediction
    raw_data.iloc[-1,8] = raw_data.iloc[-1,4] #make the latest actual = to the close
    #lets do profit calc, first figure out if long or short
    if(raw_data.iloc[-2,7] >= raw_data.iloc[-2,8]):  #this is a BUY prediction ie prediction is higher
        raw_data.iloc[-2,9] = raw_data.iloc[-1,8] - raw_data.iloc[-2,8] # diff = actuallast - actual t-2 
                        
    else:
        raw_data.iloc[-2,9] =  raw_data.iloc[-2,8]- raw_data.iloc[-1,8]  #diff = actual t-2 - actual last   

    print("raw data at very end of predict right before it's saved for js \n",raw_data)
    raw_data.set_index('date', inplace=True)
    raw_data.to_csv(path+file)  #save to csv *******************
    del model #just in case

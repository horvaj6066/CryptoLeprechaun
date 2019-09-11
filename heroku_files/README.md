# cryptoleprechaun


#to convert csv to sqlite

https://github.com/simonw/csvs-to-sqlite/blob/master/README.md

* In terminal:
pip install csvs-to-sqlite

* to create a new SQLite database called mydatabase.db containing a single table, myfile, containing the CSV content.
csvs-to-sqlite myfile.csv mydatabase.db

csvs-to-sqlite 7mos_test_data.csv 7mos_test_data.db

* provide multiple CSV files. The bundle.db database will contain two tables, one and two.
csvs-to-sqlite one.csv two.csv bundle.db





* In terminal:

* Create new environment
conda create -n CryptoL_env python=3.6

* Activate new environment
conda activate CryptoL_env

pip install gunicorn
pip install psycopg2
pip install flask
pip install flask-sqlalchemy
pip install pandas

python initdb.py

* Run the app using the following:
FLASK_APP=cryptoleprechaun/app.py flask run

* Generate requirements.txt file:
pip freeze > requirements.txt

touch Procfile

web: gunicorn cryptoleprechaun.app:app
con = sql.connect(r'/Users/linnk/Desktop/Results/GData.db')
cur = con.cursor() 
cur.execute("SHOW TABLES IN GData")
available_table=(cursor.fetchall())
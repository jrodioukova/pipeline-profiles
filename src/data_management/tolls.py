#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pandas as pd
import urllib
from sqlalchemy import create_engine
import numpy as np
import os
import json

params = urllib.parse.quote_plus(r'DRIVER={SQL Server Native Client 11.0};SERVER=pSQL22CAP;DATABASE=EnergyData;Trusted_Connection=yes')
conn_str = 'mssql+pyodbc:///?odbc_connect={}'.format(params)
conn = create_engine(conn_str)


# In[2]:


query = """SELECT * FROM [vwTolls];"""
df = pd.read_sql_query(query, conn, index_col=['Pipeline', 'Path', 'Service', 'Date'])
# df.head()


# In[72]:


# MY CODE:

colors = {'FT, Demand': "#054169",
        'Firm Full Path Service, except Seasonal Service, 1Yr Demand Charge': "#054169",
        'Firm Full Path Service, except Seasonal Service, 3Yr Demand Charge': "#054169",
        'Firm Full Path Service, except Seasonal Service, 5Yr Demand Charge': "#054169",
        'Firm Full Path Service, except Seasonal and Daily Seasonal Services, 1Yr Demand Charge': "#054169",
        'Firm Full Path Service, except Seasonal and Daily Seasonal Services, 3Yr Demand Charge': "#054169",
        'Firm Full Path Service, except Seasonal and Daily Seasonal Services, 5Yr Demand Charge': "#054169",
        'Firm Full Path Service, except Seasonal Service, 1Yr Demand Charge': "#054169",
        'Firm Full Path Service, except Seasonal Service, 3Yr Demand Charge': "#054169",
        'Firm Full Path Service, except Seasonal Service, 5Yr Demand Charge': "#054169",
        'Firm Full Path Service, except Seasonal and Daily Seasonal Services, 1Yr Demand Charge': "#054169",
        'Firm Full Path Service, except Seasonal and Daily Seasonal Services, 3Yr Demand Charge': "#054169",
        'Firm Full Path Service, except Seasonal and Daily Seasonal Services, 5Yr Demand Charge': "#054169"}

# if subfolder does not exist, make it
# if not os.path.exists("../tolls/company_data"):
#     os.mkdir("../traffic/company_data")
if not os.path.exists("C:/Users/rodijann/GitHub/pipeline-profiles/src/tolls/company_data"):
    os.mkdir("C:/Users/rodijann/GitHub/pipeline-profiles/src/tolls/company_data")

# get list of pipelines and do this for every pipeline
pipelines = ['Alliance']
for pipe in pipelines:
    df_pipe = df.loc[pipe]
    
    # metadata fro json
    meta = {'pipelineID': pipe, 'frequency': 'daily', 'units': df_pipe['Units'].unique(), 'build': True}
    
    # tolls data for json
    tolls_data = {}
    paths = df_pipe.index.unique(level='Path').values
    for path in paths:
        df_path = df_pipe.loc[path]
        dates = sorted(df_path.index.unique(level='Date').tolist())
        series = [{'name': 'date', 'xAxis':1, 'data':dates}]
        
        services = df_path.index.unique(level='Service').values
        for s in services: 
            df_service = df_path.loc[s]
            vals = []
            for d in dates:
                if d in df_service.index.get_level_values('Date'):
                    vals.append(df_service.loc[d]['Daily Toll'])
                else:
                    vals.append(np.nan)
            series.append({'name': s, 'yAxis': 0, 'color': colors[s], 'data': vals})
        tolls_data[path] = series

    data = {'meta': meta, 'tolls': tolls_data}
    
       
#     with open('../traffic/company_data/'+folder_name+'.json', 'w') as fp:
#         json.dump(data, fp, default=str)
    with open('C:/Users/rodijann/GitHub/pipeline-profiles/src/tolls/company_data/'+pipe+'.json', 'w') as fp:
        json.dump(data, fp, default=str)


# In[ ]:





# In[ ]:





# In[ ]:





# In[ ]:





# In[ ]:





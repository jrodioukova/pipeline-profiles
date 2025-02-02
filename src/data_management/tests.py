import unittest
from incidents import process_incidents
from conditions import process_conditions
from traffic import process_throughput
from util import most_common
import pandas as pd


class TestUtil(unittest.TestCase):
    testData = {'row_1': [5, 3, 2, 1, 0, 0, 0, 1],
                'row_2': ['e', 'a', 'b', 'c', 'd', 'e', 'e', 'c'],
                'row_3': ['4', '4', '4', '4', '8', '8', '8', '8']}
    df = pd.DataFrame.from_dict(testData, orient='columns')

    def testMostCommonText1(self):
        meta = {}
        meta = most_common(self.df, meta, "row_2", "testTop1", top=1)
        self.assertEqual(meta["testTop1"], "e")

    def testMostCommonNumber1(self):
        meta = {}
        meta = most_common(self.df, meta, "row_1", "testTop1", top=1)
        self.assertEqual(meta["testTop1"], "0")

    def testMostCommonText2(self):
        meta = {}
        meta = most_common(self.df, meta, "row_2", "testTop2", top=2)
        self.assertEqual(meta["testTop2"], {'e': 3, 'c': 2})

    def testMostCommonTie(self):
        meta = {}
        meta = most_common(self.df, meta, "row_3", "testTie", top=1)
        self.assertEqual(meta["testTie"], "4 & 8")


class TestNovaIncidents(unittest.TestCase):
    df, volume, meta = process_incidents(remote=False, companies=['NOVA Gas Transmission Ltd.'], test=True)

    def countIncidentType(self, iType, df):
        count = 0
        for t in df['Incident Types']:
            if iType in t:
                count = count + 1
        return count

    def testTotal(self):
        self.assertEqual(len(self.df), 338)  # total incidents for NGTL
        self.assertEqual(len(self.volume), 90)  # total release incidents

    def testIncidentTypes(self):
        # test on full NGTL data
        self.assertEqual(self.countIncidentType("Adverse Environmental Effects", self.df), 7)
        self.assertEqual(self.countIncidentType("Serious Injury (CER or TSB)", self.df), 13)
        self.assertEqual(self.countIncidentType("Fatality", self.df), 1)
        # test on calcualted sumamry metadata
        self.assertEqual(self.meta["seriousEvents"]["Adverse Environmental Effects"], 7)
        self.assertEqual(self.meta["seriousEvents"]["Serious Injury (CER or TSB)"], 13)
        self.assertEqual(self.meta["seriousEvents"]["Fatality"], 1)

    def testVariableCounts(self):
        substance = self.volume[self.volume['Substance'] == "ngsweet"].copy()
        status = self.volume[self.volume['Status'] == "c"].copy()
        year = self.volume[self.volume['Year'] == 2013].copy()
        self.assertEqual(len(substance), 84)
        self.assertEqual(len(status), 86)
        self.assertEqual(len(year), 2)
        trueSubstanceRelease = 38402739.2
        self.assertTrue(trueSubstanceRelease-1 <= int(substance['vol'].sum()) <= trueSubstanceRelease+1)
        trueStatusRelease = 26912716.7
        self.assertTrue(trueStatusRelease-1 <= int(status['vol'].sum()) <= trueStatusRelease)
        trueYearRelease = 20800000
        self.assertTrue(trueYearRelease-1 <= int(year['vol'].sum()) <= trueYearRelease+1)

    def testTrends(self):
        year = self.volume[self.volume['Year'] == 2016].copy()
        self.assertEqual(len(year), 8)


class NovaTotalConditions(unittest.TestCase):
    company_df, regions, mapMeta, meta = process_conditions(remote=False, companies=['NOVA Gas Transmission Ltd.'], test=True, lang='en')

    def testCompanyData(self):
        in_Progress = self.company_df[self.company_df['Condition Status'] == "In Progress"].copy().reset_index(drop=True)
        closed = self.company_df[self.company_df['Condition Status'] == "Closed"].copy().reset_index(drop=True)
        self.assertEqual(len(self.company_df), 1569)
        self.assertEqual(len(in_Progress), 157)
        self.assertEqual(len(closed), 1412)

    def testMeta(self):
        self.assertEqual(self.meta["summary"]["Closed"], 1367)
        self.assertEqual(self.meta["summary"]["In Progress"], 151)
        self.assertEqual(self.meta["summary"]["notOnMap"]["total"], 51)
        self.assertEqual(self.meta["summary"]["notOnMap"]["status"]["Closed"], 45)
        self.assertEqual(self.meta["summary"]["notOnMap"]["status"]["In Progress"], 6)
        total = self.meta["summary"]["Closed"] + self.meta["summary"]["In Progress"] + self.meta["summary"]["notOnMap"]["total"]
        self.assertEqual(total, 1569)

    def testMapMeta(self):
        red_deer = self.mapMeta[self.mapMeta['id'] == "Red Deer"].copy().reset_index(drop=True)
        self.assertEqual(red_deer.loc[0, "In Progress"], 9)
        self.assertEqual(red_deer.loc[0, "Closed"], 35)


class NovaTraffic(unittest.TestCase):
    traffic, df = process_throughput(test=False, sql=False, commodity='gas', frequency='monthly', companies=['NOVA Gas Transmission Ltd.'])

    def testMeta(self):
        self.assertEqual(self.traffic["meta"]["units"], "Bcf/d")
        self.assertEqual(self.traffic["meta"]["build"], True)
        self.assertEqual(self.traffic["meta"]["defaultPoint"], '32')
        # check that there is a trend text for every traffic dataset
        trendLength = len(self.traffic["meta"]["trendText"])
        dataSets = len(self.traffic["traffic"])
        self.assertEqual(trendLength, dataSets)
        # check that min date has not changed
        point = self.traffic["traffic"]["32"]
        self.assertEqual(point[0]["min"], [2005, 11, 1])
        # check one data point for traffic and capacity
        # traffic
        self.assertEqual(point[1]["id"], "in")
        self.assertEqual(point[1]["data"][0], 5.71)
        # capacity
        self.assertEqual(point[2]["id"], "cap")
        self.assertEqual(point[2]["data"][0], 6.62)


if __name__ == "__main__":
    unittest.main()
